import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession, fetchUserProfile, onAuthStateChange } from '../../services/authService';

/**
 * AuthContext — Provides the authenticated user, their profile/role,
 * role helper booleans (isAdmin, isCompagnon), and loading state to the component tree.
 */
const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isCompagnon: false,
});

/**
 * useAuth — Custom hook for consuming auth context.
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider — Wraps the app to provide authentication state.
 * Recognizes staff ('admin', 'user') and companion ('compagnon') roles.
 */
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId, userEmail) {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await fetchUserProfile(userId, userEmail);
      if (error) {
        console.warn('Could not load user profile (may not exist yet):', error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.warn('Unexpected error loading profile:', err);
      setProfile(null);
    }
  }

  useEffect(() => {
    let isMounted = true;

    getSession()
      .then(async ({ data }) => {
        if (!isMounted) return;
        const currentUser = data?.session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await loadProfile(currentUser.id, currentUser.email);
        }
      })
      .catch((err) => {
        console.warn('Failed to get session:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      const updatedUser = session?.user ?? null;
      setUser(updatedUser);
      if (updatedUser) {
        loadProfile(updatedUser.id, updatedUser.email);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Compute RBAC helper booleans and permissions
  const rawRole = profile?.role || profile?.roles?.name || 'Admin';
  const roleName = rawRole;
  const normRole = String(rawRole).toLowerCase();

  const isAdmin = normRole === 'admin' || normRole === 'administrateur';
  const isEditor = ['editor', 'manager', 'éditeur', 'user', 'utilisateur'].includes(normRole);
  const isViewer = ['viewer', 'lecteur', 'read', 'compagnon'].includes(normRole);

  const canAdd = isAdmin || isEditor;
  const canEdit = isAdmin || isEditor;
  const canDelete = isAdmin;
  const isCompagnon = Boolean(profile?.is_compagnon);

  return (
    <AuthContext.Provider value={{ user, profile, loading, roleName, isCompagnon, isAdmin, isEditor, isViewer, canAdd, canEdit, canDelete }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
