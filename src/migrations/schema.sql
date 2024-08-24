-- schema.sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  avatar_url VARCHAR(255),
  avatar_public_id VARCHAR(255),
  tokens TEXT[],
  favorites INTEGER[],
  followers INTEGER[],
  followings INTEGER[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

 
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

