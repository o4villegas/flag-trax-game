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
  'scrypt:f3657a03c65dbc6f59b4b0a853bfbcb5:cd9c0f9a143c363cc6a8d6be66cb71fd3ef0a6ea09369d59c1da47e7b3b150d308bd1e572ea49c156769088e1743a965c721c3810e059655de463d78179a1c45',
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
  'scrypt:f3657a03c65dbc6f59b4b0a853bfbcb5:cd9c0f9a143c363cc6a8d6be66cb71fd3ef0a6ea09369d59c1da47e7b3b150d308bd1e572ea49c156769088e1743a965c721c3810e059655de463d78179a1c45',
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
  'scrypt:f3657a03c65dbc6f59b4b0a853bfbcb5:cd9c0f9a143c363cc6a8d6be66cb71fd3ef0a6ea09369d59c1da47e7b3b150d308bd1e572ea49c156769088e1743a965c721c3810e059655de463d78179a1c45',
  unixepoch() * 1000,
  unixepoch() * 1000
);
