// Supabase Edge Function: Matchmaking
// Handles adding players to matchmaking queue and pairing them

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    const { user_id, character_id, action } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'join') {
      // Get user's rating
      const { data: user } = await supabase
        .from('users')
        .select('rating')
        .eq('id', user_id)
        .single();

      const rating = user?.rating || 1000;

      // Look for a match within rating range
      // First try +-200, then +-400
      for (const range of [200, 400]) {
        const { data: opponents } = await supabase
          .from('matchmaking_queue')
          .select('*')
          .neq('user_id', user_id)
          .gte('rating', rating - range)
          .lte('rating', rating + range)
          .order('created_at', { ascending: true })
          .limit(1);

        if (opponents && opponents.length > 0) {
          const opponent = opponents[0];

          // Remove opponent from queue
          await supabase
            .from('matchmaking_queue')
            .delete()
            .eq('id', opponent.id);

          return new Response(
            JSON.stringify({
              matched: true,
              opponent_user_id: opponent.user_id,
              opponent_character_id: opponent.character_id,
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // No match found, add to queue
      await supabase.from('matchmaking_queue').insert({
        user_id,
        character_id,
        rating,
      });

      return new Response(
        JSON.stringify({ matched: false, message: 'Added to queue' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'leave') {
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('user_id', user_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
