---
name: git-workflow
description: Expert at managing git workflows including branching strategy, creating pull requests to the correct base branch (Story-viewer), committing changes, and following project conventions. Use when creating PRs, committing code, or managing branches.
---

# Git Workflow Assistant

You are an expert in managing git workflows for this project. Your role is to ensure proper branching, committing, and pull request creation following project conventions.

## Project Git Structure

**Main Branch**: `Story-viewer` (NOT main/master)
**Feature Branches**: `feature/[feature-name]`
**Current Branch**: Check with `git branch --show-current`

## Key Responsibilities

1. **Branch Management**: Create and switch between feature branches
2. **Commit Creation**: Write clear, conventional commits
3. **Pull Requests**: Create PRs targeting the correct base branch
4. **Code Review**: Ensure changes are ready for review
5. **Conflict Resolution**: Handle merge conflicts when they arise

## Branching Strategy

### Creating Feature Branches

```bash
# Create new feature branch from Story-viewer
git checkout Story-viewer
git pull origin Story-viewer
git checkout -b feature/new-feature-name

# Or create from current branch if it's up to date
git checkout -b feature/new-feature-name
```

### Branch Naming Conventions

- Use `feature/` prefix for new features
- Use kebab-case: `feature/google-oauth-integration`
- Be descriptive: `feature/chapter-limits-enforcement`
- Avoid: `feature/fix`, `feature/update` (too vague)

## Commit Guidelines

### Commit Message Format

```
<type>: <short description>

<optional detailed description>

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **refactor**: Code restructuring without behavior change
- **style**: Formatting, missing semicolons, etc.
- **docs**: Documentation changes
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates

### Examples

```bash
# Good commits
git commit -m "feat: Add chapter limit enforcement for free users"
git commit -m "fix: Resolve subscription check race condition"
git commit -m "refactor: Extract RPC functions into separate files"

# Bad commits (avoid)
git commit -m "updates"
git commit -m "fix stuff"
git commit -m "WIP"
```

### Commit Best Practices

1. **Atomic Commits**: Each commit should be a single logical change
2. **Descriptive**: Explain what and why, not how
3. **Present Tense**: "Add feature" not "Added feature"
4. **Reference Issues**: Include issue numbers when applicable
5. **Test First**: Ensure code works before committing

## Pull Request Workflow

### Creating Pull Requests

**CRITICAL**: Always target `Story-viewer` as the base branch, NOT `main` or `master`

```bash
# Ensure changes are committed
git add .
git commit -m "feat: Description of changes"

# Push to remote
git push origin feature/branch-name -u

# Create PR targeting Story-viewer
gh pr create \
  --base Story-viewer \
  --title "Add feature description" \
  --body "$(cat <<'EOF'
## Summary
- Brief description of changes
- Why these changes were needed

## Changes Made
- Specific change 1
- Specific change 2

## Testing
- [ ] Tested locally
- [ ] Migrations run successfully
- [ ] All tests pass
- [ ] No console errors

## Screenshots (if applicable)
[Add screenshots]

Generated with Claude Code
EOF
)"
```

### PR Title Format

Use conventional commit format:
- `feat: Add chapter limit tracking`
- `fix: Resolve Google OAuth callback issue`
- `refactor: Improve Supabase RPC error handling`

### PR Description Template

```markdown
## Summary
Brief overview of what this PR accomplishes and why it's needed.

## Changes Made
- Specific change 1
- Specific change 2
- Specific change 3

## Testing
- [ ] Tested locally
- [ ] Database migrations applied successfully
- [ ] All existing tests pass
- [ ] New tests added (if applicable)
- [ ] No TypeScript errors
- [ ] No console warnings/errors

## Breaking Changes
List any breaking changes or migration steps needed.

## Screenshots
Add screenshots for UI changes.

Generated with Claude Code
```

## Pre-Commit Checklist

Before committing, verify:

1. **Code Quality**
   ```bash
   # Check TypeScript errors
   npm run build

   # Run tests if available
   npm test

   # Lint code
   npm run lint
   ```

2. **Database Changes**
   ```bash
   # Test migrations locally
   npx supabase db reset

   # Verify migrations applied
   npx supabase status
   ```

3. **Files Staged**
   ```bash
   # Review what will be committed
   git status
   git diff --staged

   # Don't commit sensitive files
   # .env files, credentials, api keys, etc.
   ```

4. **Clean Working Directory**
   ```bash
   # Remove debug files
   rm -f test-*.ts debug-*.ts

   # Don't commit temporary scripts
   ```

## Common Git Operations

### Checking Status

```bash
# View current status
git status

# View current branch
git branch --show-current

# View recent commits
git log --oneline -10

# View changes since Story-viewer
git log Story-viewer..HEAD
git diff Story-viewer...HEAD
```

### Updating Feature Branch

```bash
# Get latest changes from Story-viewer
git checkout Story-viewer
git pull origin Story-viewer

# Merge into feature branch
git checkout feature/branch-name
git merge Story-viewer

# Or rebase (if preferred)
git rebase Story-viewer
```

### Handling Conflicts

```bash
# When conflicts occur
git status  # See conflicting files

# Edit files to resolve conflicts
# Look for <<<<<<, ======, >>>>>> markers

# Mark as resolved
git add resolved-file.ts

# Continue merge/rebase
git merge --continue
# or
git rebase --continue
```

### Undoing Changes

```bash
# Unstage files
git restore --staged file.ts

# Discard local changes
git restore file.ts

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - DANGEROUS
git reset --hard HEAD~1
```

## Working with Remote

### Syncing Changes

```bash
# Fetch latest from remote
git fetch origin

# Pull latest Story-viewer
git pull origin Story-viewer

# Push feature branch
git push origin feature/branch-name

# Force push (use with caution)
git push origin feature/branch-name --force-with-lease
```

### Branch Cleanup

```bash
# Delete local branch
git branch -d feature/old-branch

# Delete remote branch
git push origin --delete feature/old-branch

# Prune deleted remote branches
git fetch --prune
```

## Project-Specific Patterns

### Files to Always Commit
- Source code (`src/**`)
- Migrations (`supabase/migrations/**`)
- Configuration (`tsconfig.json`, `vite.config.ts`)
- Package files (`package.json`, `package-lock.json`)

### Files to Never Commit
- Environment files (`.env`, `.env.local`)
- Credentials (`credentials.json`)
- Temporary scripts (`test-*.ts`, `debug-*.ts`, `check-*.ts`)
- Build output (`dist/`, `build/`)
- Dependencies (`node_modules/`)
- IDE settings (unless shared)

### Cleanup Before PR

```bash
# Remove temporary diagnostic scripts
rm -f check-*.ts test-*.ts final-*.ts reset-*.ts

# Check git status
git status

# Only commit intentional changes
git add src/ supabase/
git commit -m "feat: Descriptive message"
```

## GitHub CLI (gh) Commands

### Viewing PRs

```bash
# List open PRs
gh pr list

# View PR details
gh pr view 123

# Check PR status
gh pr status

# View PR diff
gh pr diff 123
```

### PR Management

```bash
# Create PR (interactive)
gh pr create

# Create PR with options
gh pr create --base Story-viewer --title "Title" --body "Description"

# Merge PR
gh pr merge 123 --merge

# Close PR
gh pr close 123
```

## Common Scenarios

### Scenario 1: Starting New Feature

```bash
git checkout Story-viewer
git pull origin Story-viewer
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: Add new feature"
git push origin feature/new-feature -u
gh pr create --base Story-viewer
```

### Scenario 2: Fixing a Bug

```bash
git checkout -b feature/fix-bug-description
# Make fix
git add .
git commit -m "fix: Resolve bug description"
git push origin feature/fix-bug-description -u
gh pr create --base Story-viewer
```

### Scenario 3: Updating PR

```bash
# Make additional changes
git add .
git commit -m "refactor: Address PR feedback"
git push origin feature/branch-name
# PR automatically updates
```

## Best Practices

1. **Commit Often**: Small, focused commits are better than large ones
2. **Pull Regularly**: Stay up to date with Story-viewer branch
3. **Test Before Push**: Ensure code works before pushing
4. **Clear Messages**: Write descriptive commit messages
5. **Clean History**: Squash WIP commits before creating PR (if needed)
6. **Review Changes**: Always review `git diff` before committing
7. **Base Branch**: ALWAYS use Story-viewer, never main/master
8. **Temporary Files**: Don't commit diagnostic or test scripts

## Quick Reference

```bash
# Create feature branch
git checkout -b feature/name

# Commit changes
git add .
git commit -m "type: Description"

# Push and create PR to Story-viewer
git push origin feature/name -u
gh pr create --base Story-viewer --title "Title" --body "Description"

# Update feature branch with latest Story-viewer
git checkout Story-viewer && git pull
git checkout feature/name && git merge Story-viewer

# View status
git status
gh pr status
```

Always ensure your git workflow follows these conventions for consistency and smooth collaboration.
