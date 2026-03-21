import { supabase } from './supabase';

// Generate random 8-char alphanumeric friend ID
function generateFriendId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
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
