import { createClient } from '@supabase/supabase-js';
import supabase from './supabaseClient';

/**
 * authService — Handles all Supabase authentication operations.
 */

/**
 * Sign in with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {{ data, error }} Supabase auth response
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * Sign out the current user.
 * @returns {{ error }} Supabase auth response
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current authenticated session.
 * @returns {{ data: { session }, error }}
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

/**
 * Fetch the profile (with role name) for a given user ID.
 * @param {string} userId
 * @returns {{ data, error }}
 */
export async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, roles(id, name)')
    .eq('id', userId)
    .maybeSingle();
  return { data, error };
}

/**
 * Fetch all user profiles with role names (for Admin user management).
 * @returns {Promise<{ data: array, error: object }>}
 */
export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, roles(id, name)')
    .order('created_at', { ascending: false });
  return { data, error };
}

/**
 * Send password reset email to a user.
 * @param {string} email
 * @returns {Promise<{ data, error }>}
 */
export async function sendPasswordReset(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}

/**
 * Register a new user and create their profile record.
 * Note: Uses a temporary Supabase client with persistSession:false to prevent
 * session hijacking of the active Admin user. In production, an Edge Function
 * or Service Role Key is recommended for Admin user creation.
 * @param {object} data - { email, password, first_name, last_name, role_name }
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function registerNewUser(data) {
  const { email, password, first_name, last_name, role_name = 'user' } = data;

  try {
    // 1. Create a temporary client without session persistence
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    let authResult;
    if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://mock.supabase.co') {
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { data: authData, error: signUpErr } = await tempClient.auth.signUp({
        email,
        password,
        options: {
          data: { first_name, last_name, name: `${first_name} ${last_name}` },
        },
      });

      if (signUpErr) {
        return { data: null, error: signUpErr };
      }
      authResult = authData.user;
    } else {
      // Offline / demo fallback ID
      authResult = { id: `demo-user-${Date.now()}`, email };
    }

    const newUserId = authResult?.id;
    if (!newUserId) {
      return {
        data: null,
        error: new Error("Utilisateur créé mais ID introuvable. (Note : En production, l'utilisation d'une Edge Function avec Service Role est conseillée)."),
      };
    }

    // 2. Fetch role_id for the requested role_name ('admin' or 'user')
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', role_name)
      .maybeSingle();

    const role_id = roleData?.id || null;

    // 3. Insert or update the user's profile row
    const profilePayload = {
      id: newUserId,
      first_name,
      last_name,
      role_id,
      created_at: new Date().toISOString(),
    };

    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .upsert([profilePayload])
      .select('*, roles(id, name)')
      .maybeSingle();

    if (profileErr) {
      console.error('⚠️ Profile upsert error:', profileErr.message);
    }

    return {
      data: profileData || { ...profilePayload, email, roles: { name: role_name } },
      error: null,
    };
  } catch (err) {
    console.error('❌ Error in registerNewUser:', err);
    return { data: null, error: err };
  }
}

/**
 * Subscribe to auth state changes (login, logout, token refresh).
 * @param {function} callback - Called with (event, session)
 * @returns {{ data: { subscription } }}
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Submit a password reset ticket request from the Login screen.
 * @param {string} email
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function submitPasswordResetRequest(email) {
  const { data, error } = await supabase
    .from('password_reset_requests')
    .insert([{ email: email.trim().toLowerCase(), status: 'pending' }])
    .select()
    .maybeSingle();

  return { data, error };
}

/**
 * Fetch all password reset requests for Admin review.
 * @returns {Promise<{ data: array, error: object }>}
 */
export async function fetchPasswordResetRequests() {
  const { data, error } = await supabase
    .from('password_reset_requests')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Admin resolves a password reset request by generating/assigning a temporary password.
 * @param {string} id
 * @param {string} tempPassword
 * @returns {Promise<{ data: object, error: object }>}
 */
export async function resolvePasswordResetRequest(id, tempPassword) {
  const { data, error } = await supabase
    .from('password_reset_requests')
    .update({
      status: 'resolved',
      temp_password: tempPassword,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  return { data, error };
}

/**
 * Delete a password reset request.
 * @param {string} id
 * @returns {Promise<{ error: object }>}
 */
export async function deletePasswordResetRequest(id) {
  const { error } = await supabase
    .from('password_reset_requests')
    .delete()
    .eq('id', id);

  return { error };
}

