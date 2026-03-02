// ADOPTE UN ARTISTE IA — Social API (follows, likes, comments, saves)
import { cors, json, err, verifyAuth, sanitize, rateLimit } from './_middleware.js';

const ACTIONS = ['follow', 'unfollow', 'like', 'unlike', 'comment', 'delete_comment', 'save', 'unsave'];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res).status(204).end();
  if (req.method !== 'POST') return err(res, 'POST only', 405);

  const rl = rateLimit(`social-${req.headers['x-forwarded-for'] || 'unknown'}`, 60, 60000);
  if (!rl.ok) return err(res, 'Rate limited', 429);

  const { action, ...params } = req.body || {};
  if (!ACTIONS.includes(action)) return err(res, `Invalid action. Allowed: ${ACTIONS.join(', ')}`, 400);

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
    if (action === 'follow') {
      const { follower_id, following_id } = params;
      if (!follower_id || !following_id) return err(res, 'Missing follower_id or following_id', 400);
      if (follower_id === following_id) return err(res, 'Cannot follow yourself', 400);

      const r = await fetch(`${SB_URL}/rest/v1/follows`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates' },
        body: JSON.stringify({ follower_id: sanitize(follower_id), following_id: sanitize(following_id) })
      });
      const data = await r.json();

      // Update stats
      await Promise.all([
        sbRpc(SB_URL, headers, 'artists', follower_id, 'stats', 'following', 1),
        sbRpc(SB_URL, headers, 'artists', following_id, 'stats', 'followers', 1)
      ]);

      // Create notification
      await createNotification(SB_URL, headers, {
        recipient_id: following_id,
        actor_id: follower_id,
        type: 'follow',
        entity_type: 'artist',
        entity_id: follower_id,
        message: 'a commencé à vous suivre'
      });

      return json(res, { ok: true, data });
    }

    if (action === 'unfollow') {
      const { follower_id, following_id } = params;
      if (!follower_id || !following_id) return err(res, 'Missing IDs', 400);

      await fetch(`${SB_URL}/rest/v1/follows?follower_id=eq.${sanitize(follower_id)}&following_id=eq.${sanitize(following_id)}`, {
        method: 'DELETE', headers
      });

      await Promise.all([
        sbRpc(SB_URL, headers, 'artists', follower_id, 'stats', 'following', -1),
        sbRpc(SB_URL, headers, 'artists', following_id, 'stats', 'followers', -1)
      ]);

      return json(res, { ok: true });
    }

    if (action === 'like') {
      const { artist_id, artwork_id } = params;
      if (!artist_id || !artwork_id) return err(res, 'Missing artist_id or artwork_id', 400);

      const r = await fetch(`${SB_URL}/rest/v1/likes`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates' },
        body: JSON.stringify({ artist_id: sanitize(artist_id), artwork_id: sanitize(artwork_id) })
      });
      const data = await r.json();

      // Update artwork stats
      await sbIncrement(SB_URL, headers, 'artworks', artwork_id, 'stats', 'likes', 1);

      // Get artwork owner for notification
      const artworkRes = await fetch(`${SB_URL}/rest/v1/artworks?id=eq.${sanitize(artwork_id)}&select=artist_id`, { headers });
      const [artwork] = await artworkRes.json();
      if (artwork && artwork.artist_id !== artist_id) {
        await createNotification(SB_URL, headers, {
          recipient_id: artwork.artist_id,
          actor_id: artist_id,
          type: 'like',
          entity_type: 'artwork',
          entity_id: artwork_id,
          message: 'a aimé votre œuvre'
        });
      }

      return json(res, { ok: true, data });
    }

    if (action === 'unlike') {
      const { artist_id, artwork_id } = params;
      if (!artist_id || !artwork_id) return err(res, 'Missing IDs', 400);

      await fetch(`${SB_URL}/rest/v1/likes?artist_id=eq.${sanitize(artist_id)}&artwork_id=eq.${sanitize(artwork_id)}`, {
        method: 'DELETE', headers
      });

      await sbIncrement(SB_URL, headers, 'artworks', artwork_id, 'stats', 'likes', -1);
      return json(res, { ok: true });
    }

    if (action === 'comment') {
      const { artwork_id, artist_id, content, parent_id } = params;
      if (!artwork_id || !artist_id || !content) return err(res, 'Missing required fields', 400);
      if (content.length > 2000) return err(res, 'Comment too long (max 2000 chars)', 400);

      const body = {
        artwork_id: sanitize(artwork_id),
        artist_id: sanitize(artist_id),
        content: sanitize(content)
      };
      if (parent_id) body.parent_id = sanitize(parent_id);

      const r = await fetch(`${SB_URL}/rest/v1/comments`, {
        method: 'POST', headers, body: JSON.stringify(body)
      });
      const data = await r.json();

      await sbIncrement(SB_URL, headers, 'artworks', artwork_id, 'stats', 'comments', 1);

      const artworkRes = await fetch(`${SB_URL}/rest/v1/artworks?id=eq.${sanitize(artwork_id)}&select=artist_id`, { headers });
      const [artwork] = await artworkRes.json();
      if (artwork && artwork.artist_id !== artist_id) {
        await createNotification(SB_URL, headers, {
          recipient_id: artwork.artist_id,
          actor_id: artist_id,
          type: parent_id ? 'reply' : 'comment',
          entity_type: 'artwork',
          entity_id: artwork_id,
          message: parent_id ? 'a répondu à votre commentaire' : 'a commenté votre œuvre'
        });
      }

      return json(res, { ok: true, data });
    }

    if (action === 'delete_comment') {
      const { comment_id, artist_id } = params;
      if (!comment_id || !artist_id) return err(res, 'Missing IDs', 400);

      // Verify ownership
      const chk = await fetch(`${SB_URL}/rest/v1/comments?id=eq.${sanitize(comment_id)}&select=artist_id,artwork_id`, { headers });
      const [comment] = await chk.json();
      if (!comment || comment.artist_id !== artist_id) return err(res, 'Not authorized', 403);

      await fetch(`${SB_URL}/rest/v1/comments?id=eq.${sanitize(comment_id)}`, { method: 'DELETE', headers });
      await sbIncrement(SB_URL, headers, 'artworks', comment.artwork_id, 'stats', 'comments', -1);

      return json(res, { ok: true });
    }

    if (action === 'save') {
      const { artist_id, artwork_id, collection_id } = params;
      if (!artist_id || !artwork_id) return err(res, 'Missing IDs', 400);

      let colId = collection_id;
      if (!colId) {
        // Get or create default collection
        const colRes = await fetch(`${SB_URL}/rest/v1/collections?artist_id=eq.${sanitize(artist_id)}&name=eq.Favoris&select=id`, { headers });
        const cols = await colRes.json();
        if (cols.length > 0) {
          colId = cols[0].id;
        } else {
          const newCol = await fetch(`${SB_URL}/rest/v1/collections`, {
            method: 'POST', headers,
            body: JSON.stringify({ artist_id: sanitize(artist_id), name: 'Favoris' })
          });
          const [col] = await newCol.json();
          colId = col.id;
        }
      }

      await fetch(`${SB_URL}/rest/v1/collection_items`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates' },
        body: JSON.stringify({ collection_id: colId, artwork_id: sanitize(artwork_id) })
      });

      await sbIncrement(SB_URL, headers, 'artworks', artwork_id, 'stats', 'saves', 1);
      return json(res, { ok: true });
    }

    if (action === 'unsave') {
      const { artwork_id, collection_id } = params;
      if (!artwork_id || !collection_id) return err(res, 'Missing IDs', 400);

      await fetch(`${SB_URL}/rest/v1/collection_items?collection_id=eq.${sanitize(collection_id)}&artwork_id=eq.${sanitize(artwork_id)}`, {
        method: 'DELETE', headers
      });

      await sbIncrement(SB_URL, headers, 'artworks', artwork_id, 'stats', 'saves', -1);
      return json(res, { ok: true });
    }

  } catch (e) {
    console.error('[social]', e);
    return err(res, 'Internal error', 500);
  }
}

// Helper: increment a JSONB stats field
async function sbIncrement(sbUrl, headers, table, id, jsonCol, field, delta) {
  const r = await fetch(`${sbUrl}/rest/v1/${table}?id=eq.${id}&select=${jsonCol}`, { headers });
  const [row] = await r.json();
  if (!row) return;
  const stats = row[jsonCol] || {};
  stats[field] = Math.max(0, (stats[field] || 0) + delta);
  await fetch(`${sbUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ [jsonCol]: stats })
  });
}

// Alias
const sbRpc = sbIncrement;

// Helper: create notification
async function createNotification(sbUrl, headers, notif) {
  await fetch(`${sbUrl}/rest/v1/notifications`, {
    method: 'POST', headers,
    body: JSON.stringify(notif)
  });
}
