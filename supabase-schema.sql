-- About Last Night - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE event_status AS ENUM ('waiting', 'active', 'voting', 'completed');
CREATE TYPE event_type AS ENUM ('wedding', 'festival', 'party', 'corporate', 'other');

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_code VARCHAR(6) UNIQUE NOT NULL,
    event_type event_type NOT NULL DEFAULT 'wedding',
    max_participants INTEGER NOT NULL DEFAULT 50,
    max_photos_per_user INTEGER NOT NULL DEFAULT 10,
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    status event_status NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255) NOT NULL DEFAULT 'anonymous'
);

-- Event participants table
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    photos_taken INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(event_id, user_name)
);

-- Event photos table
CREATE TABLE event_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES event_participants(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    votes_count INTEGER NOT NULL DEFAULT 0,
    award_categories TEXT[] DEFAULT '{}'
);

-- Photo votes table
CREATE TABLE photo_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES event_photos(id) ON DELETE CASCADE,
    voter_participant_id UUID NOT NULL REFERENCES event_participants(id) ON DELETE CASCADE,
    award_category VARCHAR(50) NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(photo_id, voter_participant_id, award_category)
);

-- Indexes for better performance
CREATE INDEX idx_events_code ON events(event_code);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_participants_event ON event_participants(event_id);
CREATE INDEX idx_participants_active ON event_participants(event_id, is_active);
CREATE INDEX idx_photos_event ON event_photos(event_id);
CREATE INDEX idx_photos_participant ON event_photos(participant_id);
CREATE INDEX idx_votes_photo ON photo_votes(photo_id);
CREATE INDEX idx_votes_voter ON photo_votes(voter_participant_id);

-- Row Level Security (RLS) Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_votes ENABLE ROW LEVEL SECURITY;

-- Events policies (public read, no auth required for now)
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create events" ON events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Event creators can update their events" ON events
    FOR UPDATE USING (true);

-- Event participants policies
CREATE POLICY "Participants are viewable by everyone" ON event_participants
    FOR SELECT USING (true);

CREATE POLICY "Anyone can join events" ON event_participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can update their own data" ON event_participants
    FOR UPDATE USING (true);

-- Event photos policies
CREATE POLICY "Photos are viewable by everyone" ON event_photos
    FOR SELECT USING (true);

CREATE POLICY "Participants can upload photos" ON event_photos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Photo owners can update their photos" ON event_photos
    FOR UPDATE USING (true);

-- Photo votes policies
CREATE POLICY "Votes are viewable by everyone" ON photo_votes
    FOR SELECT USING (true);

CREATE POLICY "Participants can vote" ON photo_votes
    FOR INSERT WITH CHECK (true);

-- Functions for updating vote counts
CREATE OR REPLACE FUNCTION update_photo_votes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE event_photos 
        SET votes_count = votes_count + 1
        WHERE id = NEW.photo_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE event_photos 
        SET votes_count = votes_count - 1
        WHERE id = OLD.photo_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update vote counts
CREATE TRIGGER trigger_update_photo_votes_count
    AFTER INSERT OR DELETE ON photo_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_votes_count();

-- Function to update participant photo count
CREATE OR REPLACE FUNCTION update_participant_photo_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE event_participants 
        SET photos_taken = photos_taken + 1
        WHERE id = NEW.participant_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE event_participants 
        SET photos_taken = photos_taken - 1
        WHERE id = OLD.participant_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update participant photo counts
CREATE TRIGGER trigger_update_participant_photo_count
    AFTER INSERT OR DELETE ON event_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_photo_count();

-- Sample data (optional - remove if you don't want test data)
INSERT INTO events (title, description, event_code, event_type, max_participants, duration_minutes) VALUES
('Sarah & John Wedding', 'Capture the magical moments of our special day!', 'WED123', 'wedding', 100, 240),
('Summer Music Festival', 'Rock out and share your festival experience', 'FEST24', 'festival', 200, 480);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
