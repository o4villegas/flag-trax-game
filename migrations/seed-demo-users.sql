-- Demo users for production deployment
-- Password for all accounts: Test123!

-- Admin user (matches ADMIN_EMAIL)
INSERT OR IGNORE INTO user (id, name, email, email_verified, created_at, updated_at)
VALUES (
  'demo-admin-001',
  'Demo Admin',
  'admin@test.com',
  1,
  unixepoch() * 1000,
  unixepoch() * 1000
);

INSERT OR IGNORE INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES (
  'demo-admin-account-001',
  'demo-admin-001',
  'credential',
  'demo-admin-001',
  'scrypt:4a1705a19468303c4a1bf0a87ac9fae5:9576769d340f8fdae4aef8f75d8f72a06731fd533decc6046b7e1d1c69eeb870e7a46704ba586b79703d263652368db0afcc2b32a2e823e11c869980168482f4',
  unixepoch() * 1000,
  unixepoch() * 1000
);

-- Demo Player 1
INSERT OR IGNORE INTO user (id, name, email, email_verified, created_at, updated_at)
VALUES (
  'demo-player-001',
  'Demo Player 1',
  'player1@test.com',
  1,
  unixepoch() * 1000,
  unixepoch() * 1000
);

INSERT OR IGNORE INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES (
  'demo-player-account-001',
  'demo-player-001',
  'credential',
  'demo-player-001',
  'scrypt:4a1705a19468303c4a1bf0a87ac9fae5:9576769d340f8fdae4aef8f75d8f72a06731fd533decc6046b7e1d1c69eeb870e7a46704ba586b79703d263652368db0afcc2b32a2e823e11c869980168482f4',
  unixepoch() * 1000,
  unixepoch() * 1000
);

-- Demo Player 2
INSERT OR IGNORE INTO user (id, name, email, email_verified, created_at, updated_at)
VALUES (
  'demo-player-002',
  'Demo Player 2',
  'player2@test.com',
  1,
  unixepoch() * 1000,
  unixepoch() * 1000
);

INSERT OR IGNORE INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES (
  'demo-player-account-002',
  'demo-player-002',
  'credential',
  'demo-player-002',
  'scrypt:4a1705a19468303c4a1bf0a87ac9fae5:9576769d340f8fdae4aef8f75d8f72a06731fd533decc6046b7e1d1c69eeb870e7a46704ba586b79703d263652368db0afcc2b32a2e823e11c869980168482f4',
  unixepoch() * 1000,
  unixepoch() * 1000
);
