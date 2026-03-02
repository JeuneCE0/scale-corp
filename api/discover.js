// ADOPTE UN ARTISTE IA — Discover API (AI recommendations, trending, events)
import { cors, json, err, verifyAuth, sanitize, rateLimit } from './_middleware.js';

const ACTIONS = [
  'trending_artworks', 'trending_artists', 'ai_recommendations',
  'explore_by_discipline', 'nearby_artists',
  'get_events', 'create_event', 'attend_event',
  'get_collab_requests', 'create_collab', 'respond_collab',
  'get_notifications', 'mark_notifications_read', 'notification_count',
  'get_comments'
];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res).status(204).end();
  if (req.method !== 'POST') return err(res, 'POST only', 405);

  const rl = rateLimit(`discover-${req.headers['x-forwarded-for'] || 'unknown'}`, 60, 60000);
  if (!rl.ok) return err(res, 'Rate limited', 429);

  const { action, ...params } = req.body || {};
  if (!ACTIONS.includes(action)) return err(res, 'Invalid action', 400);

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return err(res, 'Server config error', 500);

  const headers = {
    'apikey': SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    // === TRENDING ===
    if (action === 'trending_artworks') {
      const { limit = 30, discipline } = params;
      let url = `${SB_URL}/rest/v1/artworks?visibility=eq.public&order=created_at.desc&limit=${limit}&select=*,artist:artists(id,username,display_name,avatar_url,is_verified)`;
      if (discipline) url += `&disciplines=cs.{"${sanitize(discipline)}"}`;

      const r = await fetch(url, { headers });
      const artworks = await r.json();

      // Sort by engagement score (likes + comments * 2 + saves * 1.5)
      artworks.sort((a, b) => {
        const scoreA = (a.stats?.likes || 0) + (a.stats?.comments || 0) * 2 + (a.stats?.saves || 0) * 1.5;
        const scoreB = (b.stats?.likes || 0) + (b.stats?.comments || 0) * 2 + (b.stats?.saves || 0) * 1.5;
        return scoreB - scoreA;
      });

      return json(res, { ok: true, artworks });
    }

    if (action === 'trending_artists') {
      const { limit = 20 } = params;
      const r = await fetch(
        `${SB_URL}/rest/v1/artists?select=id,username,display_name,avatar_url,bio,disciplines,styles,is_verified,stats&order=created_at.desc&limit=${limit * 2}`,
        { headers }
      );
      const artists = await r.json();

      // Sort by follower growth + artwork engagement
      artists.sort((a, b) => {
        const scoreA = (a.stats?.followers || 0) * 2 + (a.stats?.likes_received || 0) + (a.stats?.artworks || 0) * 3;
        const scoreB = (b.stats?.followers || 0) * 2 + (b.stats?.likes_received || 0) + (b.stats?.artworks || 0) * 3;
        return scoreB - scoreA;
      });

      return json(res, { ok: true, artists: artists.slice(0, limit) });
    }

    // === AI RECOMMENDATIONS ===
    if (action === 'ai_recommendations') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { artist_id, limit = 15 } = params;
      if (!artist_id) return err(res, 'Missing artist_id', 400);

      // Get current artist profile
      const meRes = await fetch(`${SB_URL}/rest/v1/artists?id=eq.${sanitize(artist_id)}&select=*`, { headers });
      const [me] = await meRes.json();
      if (!me) return err(res, 'Artist not found', 404);

      // Get who I already follow
      const fRes = await fetch(
        `${SB_URL}/rest/v1/follows?follower_id=eq.${sanitize(artist_id)}&select=following_id`,
        { headers }
      );
      const followedIds = new Set((await fRes.json()).map(f => f.following_id));
      followedIds.add(artist_id);

      // Fetch candidate artists
      const candidatesRes = await fetch(
        `${SB_URL}/rest/v1/artists?select=*&limit=100&order=created_at.desc`,
        { headers }
      );
      const candidates = (await candidatesRes.json()).filter(a => !followedIds.has(a.id));

      // AI matching algorithm
      const scored = candidates.map(candidate => {
        let score = 0;
        const reasons = [];

        // Discipline overlap (strong signal)
        const discOverlap = (me.disciplines || []).filter(d => (candidate.disciplines || []).includes(d));
        if (discOverlap.length > 0) {
          score += discOverlap.length * 25;
          reasons.push({ type: 'discipline', value: discOverlap.join(', '), weight: discOverlap.length * 25 });
        }

        // Style compatibility
        const styleOverlap = (me.styles || []).filter(s => (candidate.styles || []).includes(s));
        if (styleOverlap.length > 0) {
          score += styleOverlap.length * 20;
          reasons.push({ type: 'style', value: styleOverlap.join(', '), weight: styleOverlap.length * 20 });
        }

        // Complementary disciplines (collab potential)
        const uniqueDisc = (candidate.disciplines || []).filter(d => !(me.disciplines || []).includes(d));
        if (uniqueDisc.length > 0 && discOverlap.length > 0) {
          score += 15;
          reasons.push({ type: 'complementary', value: uniqueDisc.join(', '), weight: 15 });
        }

        // Location proximity
        if (me.location && candidate.location && me.location.toLowerCase() === candidate.location.toLowerCase()) {
          score += 20;
          reasons.push({ type: 'location', value: candidate.location, weight: 20 });
        }

        // Experience level compatibility
        const levels = { 'amateur': 1, 'semi-pro': 2, 'professionnel': 3 };
        const levelDiff = Math.abs((levels[me.experience_level] || 1) - (levels[candidate.experience_level] || 1));
        if (levelDiff <= 1) {
          score += 10;
          reasons.push({ type: 'experience', value: candidate.experience_level, weight: 10 });
        }

        // Collab availability bonus
        if (candidate.is_available_for_collab && me.is_available_for_collab) {
          score += 10;
          reasons.push({ type: 'collab_ready', weight: 10 });
        }

        // Engagement score (popular artists get a boost)
        const engagement = (candidate.stats?.followers || 0) + (candidate.stats?.artworks || 0) * 2;
        score += Math.min(engagement * 0.5, 15);

        // Verified boost
        if (candidate.is_verified) score += 5;

        return { ...candidate, _match_score: Math.min(score, 100), _match_reasons: reasons };
      });

      scored.sort((a, b) => b._match_score - a._match_score);

      return json(res, { ok: true, recommendations: scored.slice(0, limit) });
    }

    // === EXPLORE ===
    if (action === 'explore_by_discipline') {
      const { discipline, limit = 30 } = params;
      if (!discipline) return err(res, 'Missing discipline', 400);

      const [artworksRes, artistsRes] = await Promise.all([
        fetch(`${SB_URL}/rest/v1/artworks?disciplines=cs.{"${sanitize(discipline)}"}&visibility=eq.public&order=created_at.desc&limit=${limit}&select=*,artist:artists(id,username,display_name,avatar_url,is_verified)`, { headers }),
        fetch(`${SB_URL}/rest/v1/artists?disciplines=cs.{"${sanitize(discipline)}"}&select=id,username,display_name,avatar_url,bio,is_verified,stats&order=created_at.desc&limit=10`, { headers })
      ]);

      return json(res, {
        ok: true,
        artworks: await artworksRes.json(),
        artists: await artistsRes.json()
      });
    }

    // === EVENTS ===
    if (action === 'get_events') {
      const { page = 0, limit = 20, event_type } = params;
      const offset = page * limit;
      let url = `${SB_URL}/rest/v1/events?start_date=gte.${new Date().toISOString()}&order=start_date.asc&limit=${limit}&offset=${offset}&select=*,organizer:artists!organizer_id(id,username,display_name,avatar_url)`;
      if (event_type) url += `&event_type=eq.${sanitize(event_type)}`;

      const r = await fetch(url, { headers });
      return json(res, { ok: true, events: await r.json() });
    }

    if (action === 'create_event') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { organizer_id, title, description, cover_url, event_type,
        location, start_date, end_date, max_participants, is_free, price, tags } = params;
      if (!organizer_id || !title || !start_date) return err(res, 'Missing required fields', 400);

      const event = {
        organizer_id: sanitize(organizer_id),
        title: sanitize(title),
        description: sanitize(description || ''),
        cover_url: cover_url || '',
        event_type: event_type || 'exhibition',
        location: sanitize(location || ''),
        start_date,
        end_date: end_date || null,
        max_participants: max_participants || null,
        is_free: is_free !== false,
        price: price || null,
        tags: tags || []
      };

      const r = await fetch(`${SB_URL}/rest/v1/events`, {
        method: 'POST', headers, body: JSON.stringify(event)
      });
      return json(res, { ok: true, event: (await r.json())[0] });
    }

    if (action === 'attend_event') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { event_id, artist_id, status } = params;
      if (!event_id || !artist_id) return err(res, 'Missing fields', 400);

      if (status === 'cancelled') {
        await fetch(
          `${SB_URL}/rest/v1/event_attendees?event_id=eq.${sanitize(event_id)}&artist_id=eq.${sanitize(artist_id)}`,
          { method: 'DELETE', headers }
        );
      } else {
        await fetch(`${SB_URL}/rest/v1/event_attendees`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates' },
          body: JSON.stringify({
            event_id: sanitize(event_id),
            artist_id: sanitize(artist_id),
            status: status || 'going'
          })
        });
      }
      return json(res, { ok: true });
    }

    // === COLLABS ===
    if (action === 'get_collab_requests') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { artist_id, direction = 'received' } = params;
      if (!artist_id) return err(res, 'Missing artist_id', 400);

      const field = direction === 'sent' ? 'from_artist_id' : 'to_artist_id';
      const joinField = direction === 'sent' ? 'to_artist:artists!to_artist_id' : 'from_artist:artists!from_artist_id';

      const r = await fetch(
        `${SB_URL}/rest/v1/collab_requests?${field}=eq.${sanitize(artist_id)}&order=created_at.desc&select=*,${joinField}(id,username,display_name,avatar_url,disciplines)`,
        { headers }
      );
      return json(res, { ok: true, requests: await r.json() });
    }

    if (action === 'create_collab') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { from_artist_id, to_artist_id, title, description, disciplines } = params;
      if (!from_artist_id || !to_artist_id || !title) return err(res, 'Missing fields', 400);

      const r = await fetch(`${SB_URL}/rest/v1/collab_requests`, {
        method: 'POST', headers,
        body: JSON.stringify({
          from_artist_id: sanitize(from_artist_id),
          to_artist_id: sanitize(to_artist_id),
          title: sanitize(title),
          description: sanitize(description || ''),
          disciplines: disciplines || []
        })
      });

      await fetch(`${SB_URL}/rest/v1/notifications`, {
        method: 'POST', headers,
        body: JSON.stringify({
          recipient_id: to_artist_id,
          actor_id: from_artist_id,
          type: 'collab_request',
          entity_type: 'collab_request',
          entity_id: (await r.clone().json())[0]?.id,
          message: 'vous propose une collaboration'
        })
      });

      return json(res, { ok: true, request: (await r.json())[0] });
    }

    if (action === 'respond_collab') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { request_id, artist_id, status } = params;
      if (!request_id || !artist_id || !['accepted', 'declined'].includes(status)) {
        return err(res, 'Invalid params', 400);
      }

      const chk = await fetch(`${SB_URL}/rest/v1/collab_requests?id=eq.${sanitize(request_id)}&select=to_artist_id,from_artist_id`, { headers });
      const [req_data] = await chk.json();
      if (!req_data || req_data.to_artist_id !== artist_id) return err(res, 'Not authorized', 403);

      await fetch(`${SB_URL}/rest/v1/collab_requests?id=eq.${sanitize(request_id)}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ status, responded_at: new Date().toISOString() })
      });

      const msg = status === 'accepted' ? 'a accepté votre demande de collaboration' : 'a décliné votre demande de collaboration';
      await fetch(`${SB_URL}/rest/v1/notifications`, {
        method: 'POST', headers,
        body: JSON.stringify({
          recipient_id: req_data.from_artist_id,
          actor_id: artist_id,
          type: 'collab_request',
          entity_type: 'collab_request',
          entity_id: request_id,
          message: msg
        })
      });

      return json(res, { ok: true });
    }

    // === NOTIFICATIONS ===
    if (action === 'get_notifications') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { artist_id, page = 0, limit = 30 } = params;
      if (!artist_id) return err(res, 'Missing artist_id', 400);
      const offset = page * limit;

      const r = await fetch(
        `${SB_URL}/rest/v1/notifications?recipient_id=eq.${sanitize(artist_id)}&order=created_at.desc&limit=${limit}&offset=${offset}&select=*,actor:artists!actor_id(id,username,display_name,avatar_url)`,
        { headers }
      );
      return json(res, { ok: true, notifications: await r.json() });
    }

    if (action === 'mark_notifications_read') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { artist_id, notification_ids } = params;
      if (!artist_id) return err(res, 'Missing artist_id', 400);

      if (notification_ids && notification_ids.length) {
        const idList = notification_ids.map(id => `"${sanitize(id)}"`).join(',');
        await fetch(
          `${SB_URL}/rest/v1/notifications?id=in.(${idList})&recipient_id=eq.${sanitize(artist_id)}`,
          { method: 'PATCH', headers, body: JSON.stringify({ is_read: true }) }
        );
      } else {
        await fetch(
          `${SB_URL}/rest/v1/notifications?recipient_id=eq.${sanitize(artist_id)}&is_read=eq.false`,
          { method: 'PATCH', headers, body: JSON.stringify({ is_read: true }) }
        );
      }
      return json(res, { ok: true });
    }

    if (action === 'notification_count') {
      const { artist_id } = params;
      if (!artist_id) return err(res, 'Missing artist_id', 400);

      const r = await fetch(
        `${SB_URL}/rest/v1/notifications?recipient_id=eq.${sanitize(artist_id)}&is_read=eq.false&select=id`,
        { headers: { ...headers, 'Prefer': 'count=exact' } }
      );
      const count = parseInt(r.headers.get('content-range')?.split('/')[1] || '0');
      return json(res, { ok: true, count });
    }

    // === COMMENTS ===
    if (action === 'get_comments') {
      const { artwork_id, page = 0, limit = 30 } = params;
      if (!artwork_id) return err(res, 'Missing artwork_id', 400);
      const offset = page * limit;

      const r = await fetch(
        `${SB_URL}/rest/v1/comments?artwork_id=eq.${sanitize(artwork_id)}&parent_id=is.null&order=created_at.desc&limit=${limit}&offset=${offset}&select=*,artist:artists!artist_id(id,username,display_name,avatar_url,is_verified)`,
        { headers }
      );
      const comments = await r.json();

      // Fetch replies for each comment
      for (const comment of comments) {
        const repliesRes = await fetch(
          `${SB_URL}/rest/v1/comments?parent_id=eq.${comment.id}&order=created_at.asc&select=*,artist:artists!artist_id(id,username,display_name,avatar_url,is_verified)`,
          { headers }
        );
        comment._replies = await repliesRes.json();
      }

      return json(res, { ok: true, comments });
    }

  } catch (e) {
    console.error('[discover]', e);
    return err(res, 'Internal error', 500);
  }
}
