import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file path
const DB_PATH = path.join(process.cwd(), 'data', 'tech-mandates.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
const initDatabase = () => {
  // Profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      username TEXT,
      full_name TEXT,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Provider accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS provider_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      scope TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES profiles (user_id) ON DELETE CASCADE
    )
  `);

  // Repositories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      external_id TEXT NOT NULL,
      name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      description TEXT,
      clone_url TEXT NOT NULL,
      is_private BOOLEAN,
      language TEXT,
      default_branch TEXT,
      provider TEXT NOT NULL,
      coverage_percentage REAL,
      test_count INTEGER,
      scan_status TEXT,
      last_scan_at TEXT,
      last_coverage_update TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES profiles (user_id) ON DELETE CASCADE
    )
  `);

  // Scan results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scan_results (
      id TEXT PRIMARY KEY,
      repository_id TEXT NOT NULL,
      scan_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT,
      status TEXT,
      file_path TEXT,
      line_number INTEGER,
      package_name TEXT,
      current_version TEXT,
      recommended_version TEXT,
      coverage_percentage REAL,
      rule_id TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (repository_id) REFERENCES repositories (id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories (user_id);
    CREATE INDEX IF NOT EXISTS idx_scan_results_repository_id ON scan_results (repository_id);
    CREATE INDEX IF NOT EXISTS idx_provider_accounts_user_id ON provider_accounts (user_id);
  `);
};

// Initialize database on import
initDatabase();

export { db };
export default db; 