# Rollback Instructions

**Created**: 2025-11-13
**Original Branch**: feature/google-ai-studio-integration
**Original Commit**: 66bb259b7ee01bb403329759c8604d78603bb7fb
**Backup Branch**: backup-before-improvements

## Full Rollback (Nuclear Option)

If something goes completely wrong, revert everything:

```bash
# Switch to backup branch
git checkout backup-before-improvements

# Delete the feature branch
git branch -D feature/google-ai-studio-integration

# Recreate feature branch from backup
git checkout -b feature/google-ai-studio-integration

# Force push if needed (be careful!)
git push origin feature/google-ai-studio-integration --force
```

## Phase-Specific Rollbacks

### Phase 1: Environment Variables
```bash
# Revert client.ts
git checkout 66bb259b7ee01bb403329759c8604d78603bb7fb -- src/integrations/supabase/client.ts

# Remove env files
rm .env.local .env.example

# Rebuild
npm run build
```

### Phase 2: TypeScript Configuration
```bash
# Revert tsconfig.json
git checkout 66bb259b7ee01bb403329759c8604d78603bb7fb -- tsconfig.json

# Rebuild
npm run build
```

### Phase 3: Logging Cleanup
```bash
# Revert modified files (list will be updated as we go)
git checkout 66bb259b7ee01bb403329759c8604d78603bb7fb -- src/components/QuickStartForm.tsx
# Add more files as needed
```

### Phase 4: Database Cleanup
```bash
# Move files back from database/adhoc-fixes/
mv database/adhoc-fixes/*.sql .
rm -rf database/adhoc-fixes/
```

## Files Modified Log

This section will be updated as changes are made:

### Phase 1 Changes
- [ ] src/integrations/supabase/client.ts
- [ ] .env.example (new)
- [ ] .env.local (new)
- [ ] .gitignore (updated)

### Phase 2 Changes
- [ ] tsconfig.json

### Phase 3 Changes
- (To be listed as modified)

### Phase 4 Changes
- (SQL files moved to database/adhoc-fixes/)

## Validation Commands

After any rollback:
```bash
npm run build
npm run dev
# Test login functionality
# Test story creation
```
