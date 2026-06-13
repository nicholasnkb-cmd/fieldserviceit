# Setup Pre-Commit Hooks

This guide explains how to set up pre-commit hooks for automated ESLint checks and code formatting.

## Overview

Pre-commit hooks prevent code with linting errors or formatting issues from being committed to the repository. This ensures code quality and consistency across the team.

## Features

- ✅ Automatic ESLint checks on staged files
- ✅ Auto-fix fixable linting errors
- ✅ Prettier code formatting
- ✅ Works for both backend and frontend
- ✅ Prevents commits with linting errors
- ✅ Re-stages auto-fixed files

## Installation

### 1. Install Husky (Git Hooks Manager)

```bash
# In project root
npm install husky --save-dev

# Initialize Husky
npx husky install

# Make hooks executable (Linux/Mac only)
chmod +x .husky/*
```

### 2. Install lint-staged (Files Linter)

```bash
npm install lint-staged --save-dev
```

### 3. Install ESLint and Prettier (if not already installed)

```bash
# Frontend
cd frontend
npm install eslint prettier --save-dev

# Backend
cd ../backend
npm install eslint prettier --save-dev
```

### 4. Update package.json with Husky Scripts

Add these fields to the root `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "git add"],
    "*.{ts,tsx,js,jsx,json,md}": ["prettier --write", "git add"]
  }
}
```

## Usage

### Automatic Checking

Pre-commit hooks run automatically when you try to commit:

```bash
git add .
git commit -m "Fix bug in asset enrollment"

# Pre-commit hook runs automatically:
# 1. ESLint checks staged files
# 2. Fixes auto-fixable errors
# 3. Prettier formats code
# 4. Re-stages fixed files
# 5. If errors remain, commit is blocked
```

### Manual Checking (Before Committing)

You can also manually run the checks:

```bash
# Check frontend
cd frontend
npx eslint src --fix
npx prettier --write src

# Check backend
cd ../backend
npx eslint src --fix
npx prettier --write src
```

### Bypass Hooks (Not Recommended)

If you need to bypass pre-commit hooks for an emergency deployment:

```bash
git commit --no-verify -m "Emergency fix"
```

## Configuration Files

### `.husky/pre-commit`
The shell script that runs the pre-commit hook. It:
- Identifies staged files
- Separates frontend and backend files
- Runs ESLint on each
- Reports results with colors

### `.lintstagedrc.json`
Configuration for lint-staged, specifies which tools to run on which file types.

## Common Issues

### Issue: "husky install failed"

**Solution**: On Windows, Git may use different line endings.

```bash
# Configure Git to use Unix line endings
git config core.hooksPath .husky

# Manually make scripts executable
chmod +x .husky/pre-commit
chmod +x .husky/prepare-commit-msg
```

### Issue: "Pre-commit hook runs but doesn't fix errors"

**Solution**: Ensure ESLint is configured correctly in `.eslintrc.json`.

```bash
# Check ESLint config
npx eslint --print-config frontend/src/app/page.tsx
```

### Issue: "Hook runs but git add doesn't work"

**Solution**: Pre-commit hook already stages files. Don't double-stage.

### Issue: "Windows: scripts don't run"

**Solution**: Convert `.husky` scripts to use `sh` shebang and Git Bash.

```bash
# On Windows with Git Bash installed:
git config core.hooksPath .husky
```

## Disabling Hooks Temporarily

To temporarily disable all hooks (not recommended):

```bash
# Disable
npx husky uninstall

# Re-enable later
npx husky install
```

## Team Setup

When cloning the repository for the first time:

```bash
# Clone
git clone https://github.com/your-org/fieldserviceit.git
cd fieldserviceit

# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Setup Husky hooks
npx husky install
```

## CI/CD Integration

Pre-commit hooks are local only. For CI/CD pipelines:

```yaml
# .github/workflows/lint.yml
name: Lint & Format Check

on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm install
      - run: npm run lint
      - run: npm run format:check
```

## Benefits

1. **Code Quality**: Catches errors early before they reach code review
2. **Consistency**: Enforces style guide automatically
3. **Team Efficiency**: No need to discuss formatting during review
4. **Documentation**: Makes coding standards explicit in configuration
5. **Reduced Diff Noise**: Formatting changes don't clutter PRs

## Monitoring

Check pre-commit hook status in CI/CD:

```bash
# List all hooks
git hook list

# Check a specific hook
cat .husky/pre-commit
```

## See Also

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [ESLint Configuration](../../backend/.eslintrc.json)
- [Prettier Configuration](../../backend/.prettierrc.json)
