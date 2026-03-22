import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_USER_KEY = 'draw_battle_guest_user';

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

// Sign in with Google OAuth
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) throw error;
  return data;
}

// Sign in with Apple OAuth
export async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
  });
  if (error) throw error;
  return data;
}

// Sign in as guest - works completely offline without Supabase
export async function signInAsGuest(displayName: string) {
  const guestId = generateGuestId();
  const friendId = generateFriendId();
  const now = new Date().toISOString();

  const guestProfile = {
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
    is_guest: true,
  };

  await AsyncStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestProfile));
  return guestProfile;
}

// Get saved guest profile
export async function getGuestProfile() {
  const data = await AsyncStorage.getItem(GUEST_USER_KEY);
  if (!data) return null;
  return JSON.parse(data);
}

// Clear guest profile on logout
export async function clearGuestProfile() {
  await AsyncStorage.removeItem(GUEST_USER_KEY);
}

// Sign out
export async function signOut() {
  await clearGuestProfile();
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore Supabase errors on sign out (may not be connected)
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
