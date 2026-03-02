// ADOPTE UN ARTISTE IA — Messages API
import { cors, json, err, verifyAuth, sanitize, rateLimit } from './_middleware.js';

const ACTIONS = ['get_conversations', 'get_messages', 'send_message', 'mark_read', 'start_conversation'];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res).status(204).end();
  if (req.method !== 'POST') return err(res, 'POST only', 405);

  const rl = rateLimit(`msg-${req.headers['x-forwarded-for'] || 'unknown'}`, 60, 60000);
  if (!rl.ok) return err(res, 'Rate limited', 429);

  const { action, ...params } = req.body || {};
  if (!ACTIONS.includes(action)) return err(res, `Invalid action`, 400);

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return err(res, 'Server config error', 500);

  const auth = await verifyAuth(req, SB_URL, SB_KEY);
  if (!auth.ok) return err(res, 'Unauthorized', 401);

  const headers = {
    'apikey': SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    if (action === 'get_conversations') {
      const { artist_id } = params;
      if (!artist_id) return err(res, 'Missing artist_id', 400);

      const r = await fetch(
        `${SB_URL}/rest/v1/conversations?participant_ids=cs.{"${sanitize(artist_id)}"}&order=last_message_at.desc&select=*`,
        { headers }
      );
      const convos = await r.json();

      // Enrich with participant info
      const allParticipantIds = [...new Set(convos.flatMap(c => c.participant_ids))].filter(id => id !== artist_id);
      if (allParticipantIds.length > 0) {
        const idList = allParticipantIds.map(id => `"${sanitize(id)}"`).join(',');
        const pRes = await fetch(
          `${SB_URL}/rest/v1/artists?id=in.(${idList})&select=id,username,display_name,avatar_url,is_verified,last_active_at`,
          { headers }
        );
        const participants = await pRes.json();
        const pMap = Object.fromEntries(participants.map(p => [p.id, p]));
        convos.forEach(c => {
          c._participants = c.participant_ids.filter(id => id !== artist_id).map(id => pMap[id]).filter(Boolean);
        });
      }

      // Get unread counts
      for (const c of convos) {
        const unreadRes = await fetch(
          `${SB_URL}/rest/v1/messages?conversation_id=eq.${c.id}&sender_id=neq.${sanitize(artist_id)}&is_read=eq.false&select=id`,
          { headers: { ...headers, 'Prefer': 'count=exact' } }
        );
        c._unread = parseInt(unreadRes.headers.get('content-range')?.split('/')[1] || '0');
      }

      return json(res, { ok: true, conversations: convos });
    }

    if (action === 'start_conversation') {
      const { from_id, to_id } = params;
      if (!from_id || !to_id) return err(res, 'Missing from_id or to_id', 400);
      if (from_id === to_id) return err(res, 'Cannot message yourself', 400);

      // Check if conversation exists
      const existRes = await fetch(
        `${SB_URL}/rest/v1/conversations?participant_ids=cs.{"${sanitize(from_id)}","${sanitize(to_id)}"}&select=*`,
        { headers }
      );
      const existing = await existRes.json();
      const match = existing.find(c => c.participant_ids.length === 2);
      if (match) return json(res, { ok: true, conversation: match, existing: true });

      // Create new
      const r = await fetch(`${SB_URL}/rest/v1/conversations`, {
        method: 'POST', headers,
        body: JSON.stringify({ participant_ids: [from_id, to_id] })
      });
      const data = await r.json();
      return json(res, { ok: true, conversation: data[0], existing: false });
    }

    if (action === 'get_messages') {
      const { conversation_id, page = 0, limit = 50 } = params;
      if (!conversation_id) return err(res, 'Missing conversation_id', 400);
      const offset = page * limit;

      const r = await fetch(
        `${SB_URL}/rest/v1/messages?conversation_id=eq.${sanitize(conversation_id)}&order=created_at.desc&limit=${limit}&offset=${offset}&select=*,sender:artists!sender_id(id,username,display_name,avatar_url)`,
        { headers }
      );
      return json(res, { ok: true, messages: await r.json() });
    }

    if (action === 'send_message') {
      const { conversation_id, sender_id, content, media_url } = params;
      if (!conversation_id || !sender_id || !content) return err(res, 'Missing required fields', 400);
      if (content.length > 5000) return err(res, 'Message too long', 400);

      const msg = {
        conversation_id: sanitize(conversation_id),
        sender_id: sanitize(sender_id),
        content: sanitize(content),
        media_url: media_url ? sanitize(media_url) : ''
      };

      const r = await fetch(`${SB_URL}/rest/v1/messages`, {
        method: 'POST', headers, body: JSON.stringify(msg)
      });
      const data = await r.json();

      // Update conversation
      const preview = content.length > 100 ? content.slice(0, 100) + '…' : content;
      await fetch(`${SB_URL}/rest/v1/conversations?id=eq.${sanitize(conversation_id)}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ last_message_at: new Date().toISOString(), last_message_preview: preview })
      });

      // Notify other participants
      const convRes = await fetch(
        `${SB_URL}/rest/v1/conversations?id=eq.${sanitize(conversation_id)}&select=participant_ids`,
        { headers }
      );
      const [conv] = await convRes.json();
      if (conv) {
        const recipients = conv.participant_ids.filter(id => id !== sender_id);
        for (const recipientId of recipients) {
          await fetch(`${SB_URL}/rest/v1/notifications`, {
            method: 'POST', headers,
            body: JSON.stringify({
              recipient_id: recipientId,
              actor_id: sender_id,
              type: 'message',
              entity_type: 'conversation',
              entity_id: conversation_id,
              message: 'vous a envoyé un message'
            })
          });
        }
      }

      return json(res, { ok: true, message: data[0] });
    }

    if (action === 'mark_read') {
      const { conversation_id, reader_id } = params;
      if (!conversation_id || !reader_id) return err(res, 'Missing fields', 400);

      await fetch(
        `${SB_URL}/rest/v1/messages?conversation_id=eq.${sanitize(conversation_id)}&sender_id=neq.${sanitize(reader_id)}&is_read=eq.false`,
        {
          method: 'PATCH', headers,
          body: JSON.stringify({ is_read: true })
        }
      );
      return json(res, { ok: true });
    }

  } catch (e) {
    console.error('[messages]', e);
    return err(res, 'Internal error', 500);
  }
}
