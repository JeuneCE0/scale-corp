// ADOPTE UN ARTISTE IA — Artists API (profiles, search, feed)
import { cors, json, err, verifyAuth, sanitize, rateLimit } from './_middleware.js';

const ACTIONS = [
  'get_profile', 'update_profile', 'get_feed', 'get_artworks',
  'create_artwork', 'update_artwork', 'delete_artwork',
  'search_artists', 'get_followers', 'get_following',
  'get_collections', 'create_collection', 'get_collection_items'
];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res).status(204).end();
  if (req.method !== 'POST') return err(res, 'POST only', 405);

  const rl = rateLimit(`artists-${req.headers['x-forwarded-for'] || 'unknown'}`, 80, 60000);
  if (!rl.ok) return err(res, 'Rate limited', 429);

  const { action, ...params } = req.body || {};
  if (!ACTIONS.includes(action)) return err(res, `Invalid action. Allowed: ${ACTIONS.join(', ')}`, 400);

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
    // === PROFILES ===
    if (action === 'get_profile') {
      const { artist_id, username } = params;
      let query = `${SB_URL}/rest/v1/artists?select=*`;
      if (artist_id) query += `&id=eq.${sanitize(artist_id)}`;
      else if (username) query += `&username=eq.${sanitize(username)}`;
      else return err(res, 'Provide artist_id or username', 400);

      const r = await fetch(query, { headers });
      const data = await r.json();
      if (!data.length) return err(res, 'Artist not found', 404);
      return json(res, { ok: true, artist: data[0] });
    }

    if (action === 'update_profile') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { artist_id, ...fields } = params;
      if (!artist_id) return err(res, 'Missing artist_id', 400);

      const allowed = ['display_name', 'bio', 'avatar_url', 'cover_url', 'location',
        'website', 'disciplines', 'styles', 'experience_level',
        'is_available_for_collab', 'social_links', 'settings'];
      const update = {};
      for (const k of allowed) {
        if (fields[k] !== undefined) update[k] = typeof fields[k] === 'string' ? sanitize(fields[k]) : fields[k];
      }

      const r = await fetch(`${SB_URL}/rest/v1/artists?id=eq.${sanitize(artist_id)}`, {
        method: 'PATCH', headers, body: JSON.stringify(update)
      });
      const data = await r.json();
      return json(res, { ok: true, artist: data[0] });
    }

    // === FEED ===
    if (action === 'get_feed') {
      const { artist_id, page = 0, limit = 20 } = params;
      if (!artist_id) return err(res, 'Missing artist_id', 400);
      const offset = page * limit;

      // Get IDs of followed artists
      const fRes = await fetch(
        `${SB_URL}/rest/v1/follows?follower_id=eq.${sanitize(artist_id)}&select=following_id`, { headers }
      );
      const follows = await fRes.json();
      const followedIds = follows.map(f => f.following_id);
      followedIds.push(artist_id); // Include own artworks

      if (followedIds.length === 0) {
        // No follows: return trending/recent artworks
        const r = await fetch(
          `${SB_URL}/rest/v1/artworks?visibility=eq.public&order=created_at.desc&limit=${limit}&offset=${offset}&select=*,artist:artists(id,username,display_name,avatar_url,is_verified)`,
          { headers }
        );
        return json(res, { ok: true, artworks: await r.json(), source: 'trending' });
      }

      const idList = followedIds.map(id => `"${sanitize(id)}"`).join(',');
      const r = await fetch(
        `${SB_URL}/rest/v1/artworks?artist_id=in.(${idList})&visibility=eq.public&order=created_at.desc&limit=${limit}&offset=${offset}&select=*,artist:artists(id,username,display_name,avatar_url,is_verified)`,
        { headers }
      );
      const artworks = await r.json();

      // Check which artworks user has liked
      if (artworks.length > 0) {
        const artworkIds = artworks.map(a => `"${a.id}"`).join(',');
        const likesRes = await fetch(
          `${SB_URL}/rest/v1/likes?artist_id=eq.${sanitize(artist_id)}&artwork_id=in.(${artworkIds})&select=artwork_id`,
          { headers }
        );
        const liked = new Set((await likesRes.json()).map(l => l.artwork_id));
        artworks.forEach(a => a._liked = liked.has(a.id));
      }

      return json(res, { ok: true, artworks, source: 'feed' });
    }

    // === ARTWORKS ===
    if (action === 'get_artworks') {
      const { artist_id, page = 0, limit = 20, sort = 'created_at.desc' } = params;
      if (!artist_id) return err(res, 'Missing artist_id', 400);
      const offset = page * limit;

      const r = await fetch(
        `${SB_URL}/rest/v1/artworks?artist_id=eq.${sanitize(artist_id)}&order=${sanitize(sort)}&limit=${limit}&offset=${offset}&select=*`,
        { headers }
      );
      return json(res, { ok: true, artworks: await r.json() });
    }

    if (action === 'create_artwork') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { artist_id, title, description, media_urls, media_type, thumbnail_url,
        disciplines, tags, technique, dimensions, year_created,
        is_for_sale, price, currency, license, visibility } = params;

      if (!artist_id || !title) return err(res, 'Missing artist_id or title', 400);
      if (!media_urls || !media_urls.length) return err(res, 'At least one media URL required', 400);

      const artwork = {
        artist_id: sanitize(artist_id),
        title: sanitize(title),
        description: sanitize(description || ''),
        media_urls,
        media_type: media_type || 'image',
        thumbnail_url: thumbnail_url || media_urls[0] || '',
        disciplines: disciplines || [],
        tags: tags || [],
        technique: sanitize(technique || ''),
        dimensions: sanitize(dimensions || ''),
        year_created: year_created || new Date().getFullYear(),
        is_for_sale: !!is_for_sale,
        price: price || null,
        currency: currency || 'EUR',
        license: license || 'all_rights',
        visibility: visibility || 'public'
      };

      const r = await fetch(`${SB_URL}/rest/v1/artworks`, {
        method: 'POST', headers, body: JSON.stringify(artwork)
      });
      const data = await r.json();

      // Update artist artwork count
      const statsRes = await fetch(`${SB_URL}/rest/v1/artists?id=eq.${sanitize(artist_id)}&select=stats`, { headers });
      const [artist] = await statsRes.json();
      if (artist) {
        const stats = artist.stats || {};
        stats.artworks = (stats.artworks || 0) + 1;
        await fetch(`${SB_URL}/rest/v1/artists?id=eq.${sanitize(artist_id)}`, {
          method: 'PATCH', headers, body: JSON.stringify({ stats })
        });
      }

      return json(res, { ok: true, artwork: data[0] });
    }

    if (action === 'update_artwork') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { artwork_id, artist_id, ...fields } = params;
      if (!artwork_id || !artist_id) return err(res, 'Missing IDs', 400);

      // Verify ownership
      const chk = await fetch(`${SB_URL}/rest/v1/artworks?id=eq.${sanitize(artwork_id)}&select=artist_id`, { headers });
      const [aw] = await chk.json();
      if (!aw || aw.artist_id !== artist_id) return err(res, 'Not authorized', 403);

      const allowed = ['title', 'description', 'media_urls', 'media_type', 'thumbnail_url',
        'disciplines', 'tags', 'technique', 'dimensions', 'year_created',
        'is_for_sale', 'price', 'currency', 'license', 'visibility'];
      const update = { updated_at: new Date().toISOString() };
      for (const k of allowed) {
        if (fields[k] !== undefined) update[k] = typeof fields[k] === 'string' ? sanitize(fields[k]) : fields[k];
      }

      const r = await fetch(`${SB_URL}/rest/v1/artworks?id=eq.${sanitize(artwork_id)}`, {
        method: 'PATCH', headers, body: JSON.stringify(update)
      });
      return json(res, { ok: true, artwork: (await r.json())[0] });
    }

    if (action === 'delete_artwork') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { artwork_id, artist_id } = params;
      if (!artwork_id || !artist_id) return err(res, 'Missing IDs', 400);

      const chk = await fetch(`${SB_URL}/rest/v1/artworks?id=eq.${sanitize(artwork_id)}&select=artist_id`, { headers });
      const [aw] = await chk.json();
      if (!aw || aw.artist_id !== artist_id) return err(res, 'Not authorized', 403);

      await fetch(`${SB_URL}/rest/v1/artworks?id=eq.${sanitize(artwork_id)}`, { method: 'DELETE', headers });

      // Decrement count
      const statsRes = await fetch(`${SB_URL}/rest/v1/artists?id=eq.${sanitize(artist_id)}&select=stats`, { headers });
      const [artist] = await statsRes.json();
      if (artist) {
        const stats = artist.stats || {};
        stats.artworks = Math.max(0, (stats.artworks || 0) - 1);
        await fetch(`${SB_URL}/rest/v1/artists?id=eq.${sanitize(artist_id)}`, {
          method: 'PATCH', headers, body: JSON.stringify({ stats })
        });
      }

      return json(res, { ok: true });
    }

    // === SEARCH ===
    if (action === 'search_artists') {
      const { query, disciplines, styles, experience_level, location, page = 0, limit = 20 } = params;
      const offset = page * limit;

      let url = `${SB_URL}/rest/v1/artists?select=id,username,display_name,avatar_url,bio,disciplines,styles,experience_level,is_verified,stats&order=created_at.desc&limit=${limit}&offset=${offset}`;

      if (query) url += `&or=(display_name.ilike.*${sanitize(query)}*,username.ilike.*${sanitize(query)}*,bio.ilike.*${sanitize(query)}*)`;
      if (disciplines && disciplines.length) url += `&disciplines=ov.{${disciplines.map(sanitize).join(',')}}`;
      if (styles && styles.length) url += `&styles=ov.{${styles.map(sanitize).join(',')}}`;
      if (experience_level) url += `&experience_level=eq.${sanitize(experience_level)}`;
      if (location) url += `&location=ilike.*${sanitize(location)}*`;

      const r = await fetch(url, { headers });
      return json(res, { ok: true, artists: await r.json() });
    }

    // === SOCIAL LISTS ===
    if (action === 'get_followers') {
      const { artist_id, page = 0, limit = 50 } = params;
      if (!artist_id) return err(res, 'Missing artist_id', 400);
      const offset = page * limit;

      const r = await fetch(
        `${SB_URL}/rest/v1/follows?following_id=eq.${sanitize(artist_id)}&select=follower:artists!follower_id(id,username,display_name,avatar_url,is_verified)&order=created_at.desc&limit=${limit}&offset=${offset}`,
        { headers }
      );
      const data = await r.json();
      return json(res, { ok: true, followers: data.map(d => d.follower) });
    }

    if (action === 'get_following') {
      const { artist_id, page = 0, limit = 50 } = params;
      if (!artist_id) return err(res, 'Missing artist_id', 400);
      const offset = page * limit;

      const r = await fetch(
        `${SB_URL}/rest/v1/follows?follower_id=eq.${sanitize(artist_id)}&select=following:artists!following_id(id,username,display_name,avatar_url,is_verified)&order=created_at.desc&limit=${limit}&offset=${offset}`,
        { headers }
      );
      const data = await r.json();
      return json(res, { ok: true, following: data.map(d => d.following) });
    }

    // === COLLECTIONS ===
    if (action === 'get_collections') {
      const { artist_id } = params;
      if (!artist_id) return err(res, 'Missing artist_id', 400);

      const r = await fetch(
        `${SB_URL}/rest/v1/collections?artist_id=eq.${sanitize(artist_id)}&select=*&order=created_at.desc`,
        { headers }
      );
      return json(res, { ok: true, collections: await r.json() });
    }

    if (action === 'create_collection') {
      const auth = await verifyAuth(req, SB_URL, SB_KEY);
      if (!auth.ok) return err(res, 'Unauthorized', 401);

      const { artist_id, name, description, is_public } = params;
      if (!artist_id || !name) return err(res, 'Missing fields', 400);

      const r = await fetch(`${SB_URL}/rest/v1/collections`, {
        method: 'POST', headers,
        body: JSON.stringify({
          artist_id: sanitize(artist_id),
          name: sanitize(name),
          description: sanitize(description || ''),
          is_public: !!is_public
        })
      });
      return json(res, { ok: true, collection: (await r.json())[0] });
    }

    if (action === 'get_collection_items') {
      const { collection_id, page = 0, limit = 30 } = params;
      if (!collection_id) return err(res, 'Missing collection_id', 400);
      const offset = page * limit;

      const r = await fetch(
        `${SB_URL}/rest/v1/collection_items?collection_id=eq.${sanitize(collection_id)}&select=artwork:artworks(*,artist:artists(id,username,display_name,avatar_url))&order=added_at.desc&limit=${limit}&offset=${offset}`,
        { headers }
      );
      const data = await r.json();
      return json(res, { ok: true, items: data.map(d => d.artwork) });
    }

  } catch (e) {
    console.error('[artists]', e);
    return err(res, 'Internal error', 500);
  }
}
