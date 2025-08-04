# Migration Guide: Supabase to SQLite

This guide will help you migrate your Tech Mandates application from Supabase to SQLite.

## Overview

The migration replaces the Supabase backend with a local SQLite database, providing:
- **Local data storage** - No external dependencies
- **Simplified authentication** - Local user management
- **Mock function implementations** - Local edge function replacements
- **Real-time subscriptions** - Simplified local event system

## What's Changed

### 1. Database Layer
- **Before**: Supabase PostgreSQL database
- **After**: Local SQLite database (`data/tech-mandates.db`)

### 2. Authentication
- **Before**: Supabase Auth with JWT tokens
- **After**: Local authentication with session storage

### 3. Edge Functions
- **Before**: Supabase Edge Functions (Deno)
- **After**: Local function implementations with mock data

### 4. Real-time Features
- **Before**: Supabase real-time subscriptions
- **After**: Simplified local event system

## Migration Steps

### 1. Install Dependencies

The following dependencies have been added to `package.json`:
```json
{
  "better-sqlite3": "^9.4.3",
  "uuid": "^10.0.0",
  "@types/better-sqlite3": "^7.6.9"
}
```

### 2. Run Migration Script

```bash
npm run migrate:sqlite
```

This will:
- Create the SQLite database file
- Set up all necessary tables
- Insert sample data for testing

### 3. Update Environment Variables

Remove any Supabase-related environment variables from your `.env` file:
```bash
# Remove these
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. Test the Application

Start the development server:
```bash
npm run dev
```

## File Structure

### New Files Created
```
src/integrations/sqlite/
├── database.ts          # SQLite database setup and schema
├── client.ts            # SQLite client (replaces Supabase client)
└── functions.ts         # Local function implementations

scripts/
└── migrate-to-sqlite.js # Migration script

MIGRATION_GUIDE.md       # This guide
```

### Modified Files
- `src/contexts/AuthContext.tsx` - Updated to use SQLite auth
- `src/hooks/useRepositories.ts` - Updated to use SQLite database
- `src/hooks/useDashboardMetrics.ts` - Updated to use SQLite database
- `src/hooks/useRecentActivity.ts` - Updated to use SQLite database
- All component files - Updated imports and function calls

## Database Schema

The SQLite database includes the following tables:

### profiles
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT UNIQUE NOT NULL)
- `username` (TEXT)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `created_at` (TEXT)
- `updated_at` (TEXT)

### repositories
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT NOT NULL)
- `external_id` (TEXT NOT NULL)
- `name` (TEXT NOT NULL)
- `full_name` (TEXT NOT NULL)
- `description` (TEXT)
- `clone_url` (TEXT NOT NULL)
- `is_private` (BOOLEAN)
- `language` (TEXT)
- `default_branch` (TEXT)
- `provider` (TEXT NOT NULL)
- `coverage_percentage` (REAL)
- `test_count` (INTEGER)
- `scan_status` (TEXT)
- `last_scan_at` (TEXT)
- `last_coverage_update` (TEXT)
- `created_at` (TEXT)
- `updated_at` (TEXT)

### scan_results
- `id` (TEXT PRIMARY KEY)
- `repository_id` (TEXT NOT NULL)
- `scan_type` (TEXT NOT NULL)
- `title` (TEXT NOT NULL)
- `description` (TEXT)
- `severity` (TEXT)
- `status` (TEXT)
- `file_path` (TEXT)
- `line_number` (INTEGER)
- `package_name` (TEXT)
- `current_version` (TEXT)
- `recommended_version` (TEXT)
- `coverage_percentage` (REAL)
- `rule_id` (TEXT)
- `metadata` (TEXT)
- `created_at` (TEXT)
- `updated_at` (TEXT)

### provider_accounts
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT NOT NULL)
- `provider` (TEXT NOT NULL)
- `provider_account_id` (TEXT NOT NULL)
- `access_token` (TEXT)
- `refresh_token` (TEXT)
- `scope` (TEXT)
- `expires_at` (TEXT)
- `created_at` (TEXT)
- `updated_at` (TEXT)

## Local Function Implementations

The following Supabase edge functions have been replaced with local implementations:

- `detect-current-version` - Returns mock version data
- `create-upgrade-pr` - Returns mock PR creation response
- `security-scan` - Returns mock vulnerability data
- `fix-vulnerability` - Returns mock fix response
- `fetch-coverage-data` - Returns mock coverage data
- `improve-coverage` - Returns mock improvement suggestions

## Data Migration

To migrate your existing Supabase data:

1. **Export from Supabase**:
   - Go to your Supabase dashboard
   - Export data from each table as CSV or JSON

2. **Modify the migration script**:
   - Update `scripts/migrate-to-sqlite.js`
   - Add your data import logic

3. **Run the migration**:
   ```bash
   npm run migrate:sqlite
   ```

## Limitations

### Current Limitations
- **Authentication**: Simple local authentication (no password hashing)
- **Real-time**: Basic event system (no WebSocket)
- **Functions**: Mock implementations only
- **Data persistence**: In-memory for sessions and users

### Future Improvements
- Implement proper password hashing (bcrypt)
- Add WebSocket support for real-time features
- Implement actual function logic
- Add proper session management
- Add data backup/restore functionality

## Troubleshooting

### Common Issues

1. **Database not found**:
   - Ensure the `data` directory exists
   - Run `npm run migrate:sqlite` to create the database

2. **Import errors**:
   - Make sure all dependencies are installed
   - Check that Node.js is properly configured

3. **Authentication issues**:
   - Clear browser localStorage
   - Restart the development server

### Getting Help

If you encounter issues:
1. Check the browser console for errors
2. Verify the database file exists at `data/tech-mandates.db`
3. Ensure all dependencies are installed correctly

## Rollback

To rollback to Supabase:
1. Restore the original Supabase imports
2. Remove SQLite-related files
3. Restore environment variables
4. Remove SQLite dependencies from `package.json`

## Conclusion

The migration to SQLite provides a self-contained, local development environment. While some features are simplified, this setup is perfect for development, testing, and small-scale deployments.

For production use, consider implementing the improvements mentioned in the limitations section. 