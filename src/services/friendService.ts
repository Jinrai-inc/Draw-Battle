import { supabase } from './supabase';
import type { Friend } from '../types';

export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('friends')
    .insert({ requester_id: requesterId, addressee_id: addresseeId });

  return !error;
}

export async function acceptFriendRequest(friendId: string): Promise<boolean> {
  const { error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('id', friendId);

  return !error;
}

export async function rejectFriendRequest(friendId: string): Promise<boolean> {
  const { error } = await supabase
    .from('friends')
    .update({ status: 'rejected' })
    .eq('id', friendId);

  return !error;
}

export async function getFriends(userId: string): Promise<Friend[]> {
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error || !data) return [];
  return data.map(row => ({
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getPendingRequests(userId: string): Promise<Friend[]> {
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .eq('addressee_id', userId)
    .eq('status', 'pending');

  if (error || !data) return [];
  return data.map(row => ({
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
  }));
}
