
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

interface AuthContextType {
  user: User | null;
  userProfile: Tables<'profiles'> | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signUp: (data: { email: string; password: string; options?: any }) => Promise<any>;
  signIn: (data: { email: string; password: string }) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Tables<'profiles'> | null>(null);
  const [loading, setLoading] = useState(true);

  const createOrUpdateProfile = async (user: User) => {
    try {
      console.log('Creating/updating profile for user:', user.id);
      
      const userData = user.user_metadata || {};
      const profileData = {
        id: user.id,
        full_name: userData.full_name || user.email?.split('@')[0] || 'User',
        location: userData.location || ''
      };

      console.log('Profile data to upsert:', profileData);

      // Use upsert to create or update the profile
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Profile upsert error:', error);
      } else {
        console.log('Profile created/updated successfully');
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error handling user profile:', error);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email || 'none');
      
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      // Clear guest mode when user logs in
      if (currentUser) {
        localStorage.removeItem('guestMode');
        
        // Create/update profile for authenticated users
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setTimeout(() => {
            if (mounted && currentUser) {
              createOrUpdateProfile(currentUser);
            }
          }, 0);
        } else {
          // Just fetch existing profile
          setTimeout(() => {
            if (mounted && currentUser) {
              fetchUserProfile(currentUser.id);
            }
          }, 0);
        }
      } else {
        // Clear profile when user logs out
        setUserProfile(null);
      }
      
      if (mounted) {
        setLoading(false);
      }
    });

    // Then get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Initial session user:', session?.user?.email || 'none');
          if (mounted) {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            
            // Fetch existing profile if user exists
            if (currentUser) {
              setTimeout(() => {
                if (mounted) {
                  fetchUserProfile(currentUser.id);
                }
              }, 0);
            }
          }
        }
      } catch (error) {
        console.error('Error in getSession:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (data: { email: string; password: string; options?: any }) => {
    try {
      const result = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          ...data.options,
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });
      
      console.log('SignUp result:', result);
      return result;
    } catch (error) {
      console.error('Error in signUp:', error);
      throw error;
    }
  };

  const signIn = async (data: { email: string; password: string }) => {
    try {
      const result = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      
      console.log('SignIn result:', result);
      return result;
    } catch (error) {
      console.error('Error in signIn:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear local state immediately
      setUser(null);
      setUserProfile(null);
      
      // Clear guest mode on logout
      localStorage.removeItem('guestMode');
      
      // Clear any Supabase auth keys from storage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Sign out error:', error);
      }
      
      // Force page reload to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even on error, redirect to home
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error refreshing user:', error);
      } else {
        setUser(user);
        if (user) {
          createOrUpdateProfile(user);
        }
      }
    } catch (error) {
      console.error('Error in refreshUser:', error);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signOut,
    refreshUser,
    signUp,
    signIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
