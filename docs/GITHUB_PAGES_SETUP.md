# GitHub Pages Setup Instructions

## Step 1: Enable GitHub Pages

1. Go to your repository on GitHub: https://github.com/etolopez/tarot-deck-app
2. Click on **"Settings"** (top menu bar)
3. Scroll down to the **"Pages"** section in the left sidebar
4. Under **"Source"**, select **"Deploy from a branch"**
5. Choose:
   - **Branch**: `main`
   - **Folder**: `/docs`
6. Click **"Save"**

## Step 2: Wait for Deployment

- GitHub will build and deploy your pages (usually takes 1-2 minutes)
- You'll see a message: "Your site is live at https://etolopez.github.io/tarot-deck-app/"

## Step 3: Access Your Legal Documents

Once deployed, your legal documents will be available at:

- **Main Page**: https://etolopez.github.io/tarot-deck-app/
- **Privacy Policy**: https://etolopez.github.io/tarot-deck-app/PRIVACY_POLICY.html
- **Terms of Service**: https://etolopez.github.io/tarot-deck-app/TERMS_OF_SERVICE.html
- **License**: https://etolopez.github.io/tarot-deck-app/LICENSE.html
- **Copyright**: https://etolopez.github.io/tarot-deck-app/COPYRIGHT.html

## Step 4: Update Documents

When you update the markdown files in the root directory:

1. Edit the markdown files (PRIVACY_POLICY.md, TERMS_OF_SERVICE.md, etc.)
2. Update the corresponding HTML files in the `/docs` folder
3. Commit and push changes
4. GitHub Pages will automatically update (may take a few minutes)

## Custom Domain (Optional)

If you want to use a custom domain:

1. In GitHub Pages settings, enter your custom domain
2. Add a `CNAME` file in the `/docs` folder with your domain name
3. Update your DNS settings as instructed by GitHub

## Troubleshooting

- If pages don't appear, check that the `/docs` folder contains `index.html`
- Ensure all HTML files reference `style.css` correctly
- Check GitHub Actions tab for any build errors
- Pages may take a few minutes to propagate after changes
