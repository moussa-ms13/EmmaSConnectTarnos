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

  async function loadProfile(userId) {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await fetchUserProfile(userId);
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
          await loadProfile(currentUser.id);
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
        loadProfile(updatedUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Compute RBAC helper booleans
  const roleName = profile?.roles?.name || profile?.role || 'admin';
  const isCompagnon = roleName.toLowerCase() === 'compagnon';
  const isAdmin = roleName.toLowerCase() === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, roleName, isCompagnon, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
