#!/usr/bin/env bash

# ==============================================================================
# RetroFlow Auto Deploy Script (GitHub & GitLab Production)
# Usage: ./deploy.sh "Your commit message here"
# ==============================================================================

set -e

MSG="${1:-Update RetroFlow changes}"
WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FE_REPO="/home/hello/Desktop/.deploy_repos/fe"
BE_REPO="/home/hello/Desktop/.deploy_repos/be"

echo "============================================="
echo "🚀 Starting RetroFlow Production Deployment"
echo "Commit message: $MSG"
echo "============================================="

# 1. Commit and push to GitHub (main)
echo ""
echo "📦 1/3. Pushing to GitHub (main)..."
cd "$WORKSPACE_DIR"
git add .
if git diff-index --quiet HEAD --; then
  echo "No changes to commit in workspace."
else
  git commit -m "$MSG"
  git push origin main
  echo "✅ Pushed to GitHub main successfully."
fi

# 2. Sync Frontend to GitLab (env/prod)
echo ""
echo "🎨 2/3. Syncing Frontend to GitLab (env/prod)..."
cd "$FE_REPO"
git pull origin env/prod --rebase || true

# Sync files (excluding node_modules, .git, .next)
rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env*' \
  "$WORKSPACE_DIR/client/" "$FE_REPO/"

git add .
if git diff-index --quiet HEAD --; then
  echo "No frontend changes detected."
else
  git commit -m "$MSG"
  git push origin env/prod
  echo "✅ Frontend deployed to GitLab env/prod!"
fi

# 3. Sync Backend to GitLab (env/prod)
echo ""
echo "⚙️  3/3. Syncing Backend to GitLab (env/prod)..."
cd "$BE_REPO"
git pull origin env/prod --rebase || true

# Sync files (excluding node_modules, .git)
rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env*' \
  "$WORKSPACE_DIR/server/" "$BE_REPO/"

git add .
if git diff-index --quiet HEAD --; then
  echo "No backend changes detected."
else
  git commit -m "$MSG"
  git push origin env/prod
  echo "✅ Backend deployed to GitLab env/prod!"
fi

echo ""
echo "============================================="
echo "🎉 ALL DONE! Live deployment complete on:"
echo "   - GitHub: main"
echo "   - GitLab FE: env/prod"
echo "   - GitLab BE: env/prod"
echo "============================================="
