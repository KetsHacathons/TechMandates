#!/usr/bin/env node

/**
 * Migration script to help migrate from Supabase to SQLite
 * This is a basic template - you'll need to customize it based on your specific data
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

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

console.log('🚀 Starting migration from Supabase to SQLite...');

// Create tables
const createTables = () => {
  console.log('📋 Creating tables...');
  
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

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories (user_id);
    CREATE INDEX IF NOT EXISTS idx_scan_results_repository_id ON scan_results (repository_id);
    CREATE INDEX IF NOT EXISTS idx_provider_accounts_user_id ON provider_accounts (user_id);
  `);

  console.log('✅ Tables created successfully');
};

// Sample data insertion (you can modify this to import your actual data)
const insertSampleData = () => {
  console.log('📊 Inserting sample data...');
  
  try {
    // Insert sample profile
    const profileId = 'sample-profile-id';
    const userId = 'sample-user-id';
    
    db.prepare(`
      INSERT OR REPLACE INTO profiles (id, user_id, username, full_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(profileId, userId, 'sampleuser', 'Sample User', new Date().toISOString(), new Date().toISOString());

    // Insert sample repository
    const repoId = 'sample-repo-id';
    db.prepare(`
      INSERT OR REPLACE INTO repositories (
        id, user_id, external_id, name, full_name, description, clone_url, 
        is_private, language, provider, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      repoId, userId, '123456789', 'sample-repo', 'sampleuser/sample-repo',
      'A sample repository', 'https://github.com/sampleuser/sample-repo.git',
      false, 'JavaScript', 'github', new Date().toISOString(), new Date().toISOString()
    );

    // Insert sample scan result
    const scanId = 'sample-scan-id';
    db.prepare(`
      INSERT OR REPLACE INTO scan_results (
        id, repository_id, scan_type, title, description, severity, status,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      scanId, repoId, 'security', 'Sample vulnerability', 'This is a sample vulnerability',
      'medium', 'open', new Date().toISOString(), new Date().toISOString()
    );

    console.log('✅ Sample data inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  }
};

// Migration instructions
const showMigrationInstructions = () => {
  console.log('\n📝 Migration Instructions:');
  console.log('==========================');
  console.log('1. The SQLite database has been created at:', DB_PATH);
  console.log('2. Sample data has been inserted for testing');
  console.log('3. To migrate your actual data from Supabase:');
  console.log('   - Export your data from Supabase dashboard');
  console.log('   - Modify this script to import your CSV/JSON data');
  console.log('   - Run the script again with your data');
  console.log('4. Update your application to use the SQLite client');
  console.log('5. Test the application thoroughly');
  console.log('\n🎉 Migration completed!');
};

// Main migration function
const migrate = () => {
  try {
    createTables();
    insertSampleData();
    showMigrationInstructions();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
};

// Run migration
migrate(); 