import { Platform } from 'react-native';
import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';

// Ensure web browser auth session completes properly
WebBrowser.maybeCompleteAuthSession();

// Generate random 8-char alphanumeric friend ID
function generateFriendId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateGuestId(): string {
  return 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
}

export interface SignUpWithEmailParams {
  email: string;
  password: string;
}

export interface CreateProfileParams {
  authId: string;
  displayName: string;
}

// Sign up with email + password
export async function signUpWithEmail({ email, password }: SignUpWithEmailParams) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

// Sign in with email + password
export async function signInWithEmail({ email, password }: SignUpWithEmailParams) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Sign in with Google OAuth (native mobile flow)
export async function signInWithGoogle() {
  const redirectTo = AuthSession.makeRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('No OAuth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'success') {
    const url = result.url;
    // Extract tokens from the redirect URL fragment
    const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
    }
  } else if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Login cancelled');
  }
}

// Sign in with Apple (native flow on iOS, web flow on other platforms)
export async function signInWithApple() {
  if (Platform.OS === 'ios') {
    // Use native Apple Authentication on iOS
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('No identity token returned from Apple');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;
  } else {
    // Fallback to web-based OAuth for non-iOS platforms
    const redirectTo = AuthSession.makeRedirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'success') {
      const url = result.url;
      const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      }
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Login cancelled');
    }
  }
}

// Create a guest profile (in-memory only, no external service needed)
export function createGuestProfile(displayName: string) {
  const guestId = generateGuestId();
  const friendId = generateFriendId();
  const now = new Date().toISOString();

  return {
    id: guestId,
    auth_id: guestId,
    display_name: displayName,
    friend_id: friendId,
    title_id: null,
    avatar_url: null,
    bio: null,
    rating: 1000,
    total_wins: 0,
    total_losses: 0,
    max_damage: 0,
    created_at: now,
    last_login_at: now,
  };
}

// Sign out
export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore Supabase errors on sign out
  }
}

// Get current session
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// Create user profile in the users table after auth
export async function createUserProfile({ authId, displayName }: CreateProfileParams) {
  const friendId = generateFriendId();

  const { data, error } = await supabase
    .from('users')
    .insert({
      auth_id: authId,
      display_name: displayName,
      friend_id: friendId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get user profile by auth ID
export async function getUserProfile(authId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Update display name
export async function updateDisplayName(userId: string, displayName: string) {
  const { error } = await supabase
    .from('users')
    .update({ display_name: displayName })
    .eq('id', userId);

  if (error) throw error;
}

// Update last login timestamp
export async function updateLastLogin(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}
