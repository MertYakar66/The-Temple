# Quick Reference Commands

## Daily Use

```bash
# Start development server
npm run dev
```

## Update from GitHub

```bash
# Pull latest changes
git pull origin claude/workout-tracker-onboarding-8lcp2

# If dependencies changed, reinstall
npm install

# One-liner: update and start
git pull && npm install && npm run dev
```

## Build & Deploy

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Git Commands

```bash
# Check status
git status

# See recent commits
git log --oneline -10

# Discard all local changes (careful!)
git checkout .

# Create a new branch
git checkout -b my-new-feature
```

## Troubleshooting

```bash
# Clear node_modules and reinstall
rm -rf node_modules && npm install

# Clear build cache
rm -rf dist && npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

## Server Info

- **Dev server**: http://localhost:5173/
- **Branch**: `claude/workout-tracker-onboarding-8lcp2`

## Windows (PowerShell)

```powershell
# Clone to desktop
git clone https://github.com/MertYakar66/The-Temple.git $HOME\Desktop\The_Temple

# Navigate and start
cd $HOME\Desktop\The_Temple
npm install
npm run dev
```
