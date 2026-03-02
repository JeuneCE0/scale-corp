-- ============================================================
-- ADOPTE UN ARTISTE IA — Database Schema
-- Social Network for Artists
-- ============================================================

-- 1. ARTISTS (extended user profiles)
CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  location TEXT DEFAULT '',
  website TEXT DEFAULT '',
  disciplines TEXT[] DEFAULT '{}',       -- peinture, sculpture, photo, musique, digital, etc.
  styles TEXT[] DEFAULT '{}',            -- abstrait, réaliste, street art, etc.
  experience_level TEXT DEFAULT 'amateur', -- amateur, semi-pro, professionnel
  is_verified BOOLEAN DEFAULT FALSE,
  is_available_for_collab BOOLEAN DEFAULT TRUE,
  social_links JSONB DEFAULT '{}',       -- {instagram, twitter, behance, etc.}
  stats JSONB DEFAULT '{"followers": 0, "following": 0, "artworks": 0, "likes_received": 0}',
  ai_embedding VECTOR(384),              -- for AI-powered matching
  settings JSONB DEFAULT '{"notifications": true, "private_profile": false, "show_location": true}',
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artists_user_id ON artists(user_id);
CREATE INDEX idx_artists_username ON artists(username);
CREATE INDEX idx_artists_disciplines ON artists USING GIN(disciplines);
CREATE INDEX idx_artists_styles ON artists USING GIN(styles);

-- 2. ARTWORKS (posts / creations)
CREATE TABLE IF NOT EXISTS artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  media_urls TEXT[] DEFAULT '{}',        -- array of image/video URLs
  media_type TEXT DEFAULT 'image',       -- image, video, audio, mixed
  thumbnail_url TEXT DEFAULT '',
  disciplines TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  technique TEXT DEFAULT '',             -- huile, aquarelle, digital, etc.
  dimensions TEXT DEFAULT '',            -- 100x80cm
  year_created INT,
  is_for_sale BOOLEAN DEFAULT FALSE,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  license TEXT DEFAULT 'all_rights',     -- all_rights, cc_by, cc_by_sa, cc_by_nc
  stats JSONB DEFAULT '{"likes": 0, "comments": 0, "views": 0, "saves": 0}',
  ai_tags TEXT[] DEFAULT '{}',           -- auto-generated tags by AI
  ai_description TEXT DEFAULT '',        -- AI-generated description
  visibility TEXT DEFAULT 'public',      -- public, followers, private
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artworks_artist ON artworks(artist_id);
CREATE INDEX idx_artworks_created ON artworks(created_at DESC);
CREATE INDEX idx_artworks_disciplines ON artworks USING GIN(disciplines);
CREATE INDEX idx_artworks_tags ON artworks USING GIN(tags);
CREATE INDEX idx_artworks_visibility ON artworks(visibility);

-- 3. FOLLOWS (artist relationships)
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- 4. LIKES
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, artwork_id)
);

CREATE INDEX idx_likes_artwork ON likes(artwork_id);
CREATE INDEX idx_likes_artist ON likes(artist_id);

-- 5. COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- for replies
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_artwork ON comments(artwork_id);
CREATE INDEX idx_comments_artist ON comments(artist_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- 6. SAVES / COLLECTIONS
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Favoris',
  description TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT FALSE,
  cover_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, artwork_id)
);

CREATE INDEX idx_collections_artist ON collections(artist_id);
CREATE INDEX idx_collection_items_collection ON collection_items(collection_id);

-- 7. CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_participants ON conversations USING GIN(participant_ids);
CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES artists(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- follow, like, comment, reply, mention, collab_request, system
  entity_type TEXT,   -- artwork, comment, conversation, artist
  entity_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id) WHERE is_read = FALSE;

-- 9. COLLAB REQUESTS
CREATE TABLE IF NOT EXISTS collab_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  to_artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  disciplines TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_collab_from ON collab_requests(from_artist_id);
CREATE INDEX idx_collab_to ON collab_requests(to_artist_id);
CREATE INDEX idx_collab_status ON collab_requests(status);

-- 10. REPORTS / MODERATION
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES artists(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL, -- artwork, comment, artist, message
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,      -- spam, harassment, inappropriate, copyright, other
  details TEXT DEFAULT '',
  status TEXT DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. EVENTS (exhibitions, meetups, workshops)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  event_type TEXT DEFAULT 'exhibition', -- exhibition, meetup, workshop, online
  location TEXT DEFAULT '',
  location_coords JSONB,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  max_participants INT,
  is_free BOOLEAN DEFAULT TRUE,
  price DECIMAL(10,2),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'going', -- going, interested, cancelled
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, artist_id)
);

CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_date ON events(start_date);
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);

-- 12. AI MATCH SCORES (precomputed artist compatibility)
CREATE TABLE IF NOT EXISTS ai_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_a_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  artist_b_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  score DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
  reasons JSONB DEFAULT '{}', -- {style_match, discipline_overlap, location_proximity, etc.}
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_a_id, artist_b_id)
);

CREATE INDEX idx_ai_matches_a ON ai_matches(artist_a_id, score DESC);
CREATE INDEX idx_ai_matches_b ON ai_matches(artist_b_id, score DESC);

-- Enable RLS on all tables
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_matches ENABLE ROW LEVEL SECURITY;

-- Service role access policies
CREATE POLICY "service_role_all_artists" ON artists FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_artworks" ON artworks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_follows" ON follows FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_likes" ON likes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_comments" ON comments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_collections" ON collections FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_collection_items" ON collection_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_conversations" ON conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_messages" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_notifications" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_collab_requests" ON collab_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_reports" ON reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_events" ON events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_event_attendees" ON event_attendees FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_ai_matches" ON ai_matches FOR ALL TO service_role USING (true) WITH CHECK (true);
