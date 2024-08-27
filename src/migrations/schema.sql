-- schema.sql

-- Enable the UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  avatar JSONB,
  --avatar_url VARCHAR(255),
  --avatar_public_id VARCHAR(255),
  tokens TEXT[],
  favorites UUID[], -- Changed to UUID   is user ki kon konsi favourites he audios uski id
  followers UUID[], -- Changed to UUID
  followings UUID[], -- Changed to UUID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



 --  Create the email_verification_tokens table with UUID as foreign key
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id SERIAL PRIMARY KEY,
  owner INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour') -- Token expires in 1 hour
);

-- Create indices for improved performance

-- creating using trigger because Index dont have if not exist feature
-- PostgreSQL does support IF NOT EXISTS for creating indexes, but it's available only starting from PostgreSQL 9.5.

CREATE INDEX IF NOT EXISTS  idx_created_at ON email_verification_tokens(created_at);
CREATE INDEX IF NOT EXISTS  idx_expiry ON email_verification_tokens(expiry);


-- CREATE OR REPLACE FUNCTION remove_expired_tokens() RETURNS VOID AS $$
-- BEGIN
--   DELETE FROM email_verification_tokens
--   WHERE expiry < NOW();
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Schedule the function to run every hour
-- SELECT cron.schedule(
--   'remove_expired_tokens',
--   '0 * * * *',  -- Runs every hour
--   'SELECT remove_expired_tokens();'
-- );


-- Define the PostgreSQL table schema for storing password reset tokens.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  owner UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
  UNIQUE (token)
);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'category_type'
    ) THEN
        CREATE TYPE category_type AS ENUM (
            'Arts',
            'Business',
            'Education',
            'Entertainment',
            'Kids & Family',
            'Music',
            'Science',
            'Tech',
            'Others'
        );
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS audios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    about TEXT NOT NULL,
    owner UUID REFERENCES users(id) ON DELETE SET NULL,
    file_url VARCHAR(255) NOT NULL,
    file_public_id VARCHAR(255) NOT NULL,
    poster_url VARCHAR(255),
    poster_public_id VARCHAR(255),
    category category_type DEFAULT 'Others',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--  each audio can be liked/favorited by multiple users, you need a junction table (also known as a join table) to handle the many-to-many relationship.

CREATE TABLE IF NOT EXISTS audio_favourite(
  id UUID  DEFAULT uuid_generate_v4(),   -- Unique identifier for each favorite entry
  audio_id UUID NOT NULL REFERENCES audios(id), -- Foreign key referencing the `audios` table
   user_id UUID NOT NULL REFERENCES users(id),  -- Foreign key referencing the `users` table
  PRIMARY KEY (audio_id, user_id)  -- Composite primary key ensures unique combination
);

 CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    owner UUID REFERENCES users(id) ON DELETE SET NULL,
    visibility VARCHAR(10) CHECK (visibility IN ('public', 'private', 'auto')) DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a playlist_items table to store the relationship between playlists and audios:

CREATE TABLE IF NOT EXISTS playlist_audio_items (
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    audio_id UUID NOT NULL REFERENCES audios(id),
    PRIMARY KEY (playlist_id, audio_id)
);
