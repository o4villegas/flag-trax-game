-- Auth tables from auth-schema.ts
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER DEFAULT 0 NOT NULL,
  image TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  updated_at INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
  updated_at INTEGER NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

-- Game tables from db/schema.ts
CREATE TABLE IF NOT EXISTS flag_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES user(id),
  status TEXT DEFAULT 'pending' NOT NULL,
  requested_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  processed_at TEXT,
  processed_by_admin_email TEXT
);

CREATE TABLE IF NOT EXISTS flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flag_number INTEGER NOT NULL UNIQUE,
  current_owner_id TEXT NOT NULL REFERENCES user(id),
  original_requester_id TEXT NOT NULL REFERENCES user(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_captured_at TEXT
);

CREATE TABLE IF NOT EXISTS captures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flag_id INTEGER NOT NULL REFERENCES flags(id) ON DELETE CASCADE,
  captured_by_user_id TEXT NOT NULL REFERENCES user(id),
  captured_at TEXT NOT NULL,
  notes TEXT,
  photo_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
