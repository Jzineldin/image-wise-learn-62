# Ad-hoc Database Fixes

**Purpose**: This directory contains one-time SQL scripts that were executed to fix specific database issues during development.

**⚠️ WARNING**: These scripts have already been applied and should NOT be run again unless you know exactly what you're doing.

## Files

### Feature Additions
- `add-featured-stories.sql` - Added featured stories functionality
- `database-indexes.sql` - Performance indexes for database tables

### Migration Scripts
- `apply-migrations.sql` - Main migration application script
- `apply-migrations-simplified.sql` - Simplified version of migration script
- `verify-beta-migration.sql` - Verification script for beta migration

### Feedback System Fixes
- `diagnose-feedback-issue.sql` - Diagnostic queries for feedback issues
- `fix-feedback-complete.sql` - Complete feedback system fix
- `fix-feedback-foreign-key.sql` - Foreign key constraint fixes
- `fix-feedback-rls.sql` - Row Level Security policy fixes for feedback

### Other Fixes
- `fix-preview-images-only.sql` - Preview image URL fixes
- `restore-credit-costs.sql` - Credit cost restoration after accidental changes

## Usage

These files are kept for historical reference and documentation purposes. If you need to apply similar fixes:

1. Review the SQL in these files to understand the pattern
2. Create a NEW migration in `supabase/migrations/` following the naming convention
3. Test thoroughly in local environment before applying to production

## Rollback

If Phase 4 cleanup needs to be undone:
```bash
# From project root
mv database/adhoc-fixes/*.sql .
rm -rf database/adhoc-fixes/
```
