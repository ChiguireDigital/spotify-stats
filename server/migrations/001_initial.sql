CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  spotify_user_id VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  image_url TEXT NULL,
  spotify_url TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_spotify_user_id (spotify_user_id)
);

CREATE TABLE IF NOT EXISTS spotify_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NULL,
  expires_at DATETIME NOT NULL,
  scope TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_spotify_accounts_user_id (user_id),
  CONSTRAINT fk_spotify_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS artists (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  spotify_artist_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  spotify_url TEXT NULL,
  image_url TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_artists_spotify_artist_id (spotify_artist_id)
);

CREATE TABLE IF NOT EXISTS tracks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  spotify_track_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  album_name VARCHAR(255) NULL,
  album_image_url TEXT NULL,
  duration_ms INT UNSIGNED NULL,
  spotify_url TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tracks_spotify_track_id (spotify_track_id)
);

CREATE TABLE IF NOT EXISTS track_artists (
  track_id BIGINT UNSIGNED NOT NULL,
  artist_id BIGINT UNSIGNED NOT NULL,
  artist_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (track_id, artist_id),
  CONSTRAINT fk_track_artists_track FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
  CONSTRAINT fk_track_artists_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playback_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  track_id BIGINT UNSIGNED NOT NULL,
  played_at DATETIME(3) NOT NULL,
  context_uri TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_playback_user_track_time (user_id, track_id, played_at),
  KEY idx_playback_user_played_at (user_id, played_at),
  CONSTRAINT fk_playback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_playback_track FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ranking_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  item_type ENUM('artist', 'track') NOT NULL,
  artist_id BIGINT UNSIGNED NULL,
  track_id BIGINT UNSIGNED NULL,
  time_range ENUM('short_term', 'medium_term', 'long_term') NOT NULL,
  ranking_position TINYINT UNSIGNED NOT NULL,
  captured_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_rankings_user_range (user_id, item_type, time_range, captured_at),
  CONSTRAINT fk_rankings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rankings_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  CONSTRAINT fk_rankings_track FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);
