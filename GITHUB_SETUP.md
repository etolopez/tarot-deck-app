# GitHub Setup Instructions

## 1. Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `tarot-deck-app`)
3. **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Copy the repository URL (e.g., `https://github.com/yourusername/tarot-deck-app.git`)

## 2. Push to GitHub

Run these commands in your terminal:

```bash
cd /Users/eto/Desktop/Tarot_deck

# Add remote repository
git remote add origin https://github.com/yourusername/tarot-deck-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Replace `yourusername/tarot-deck-app` with your actual GitHub username and repository name.

## 3. Verify Upload

Check your GitHub repository to ensure all files are uploaded correctly.
