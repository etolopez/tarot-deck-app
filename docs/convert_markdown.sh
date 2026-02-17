#!/bin/bash
# Convert markdown files to HTML for GitHub Pages

# Install markdown converter if needed (uncomment if needed)
# brew install pandoc  # macOS
# apt-get install pandoc  # Linux

# Convert markdown files to HTML
if command -v pandoc &> /dev/null; then
    pandoc ../PRIVACY_POLICY.md -o PRIVACY_POLICY.html --standalone --css=style.css --metadata title="Privacy Policy - Tarot Deck App"
    pandoc ../TERMS_OF_SERVICE.md -o TERMS_OF_SERVICE.html --standalone --css=style.css --metadata title="Terms of Service - Tarot Deck App"
    pandoc ../LICENSE -o LICENSE.html --standalone --css=style.css --metadata title="License - Tarot Deck App"
    pandoc ../COPYRIGHT -o COPYRIGHT.html --standalone --css=style.css --metadata title="Copyright - Tarot Deck App"
    echo "Markdown files converted to HTML successfully!"
else
    echo "Pandoc not found. Creating simple HTML versions..."
    # Create simple HTML versions without pandoc
    cat > PRIVACY_POLICY.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Tarot Deck App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <a href="index.html">← Back to Legal Documents</a>
        <h1>Privacy Policy</h1>
        <p><em>Last Updated: February 14, 2026</em></p>
        <div class="content">
            <p>Please see the <a href="https://github.com/etolopez/tarot-deck-app/blob/main/PRIVACY_POLICY.md">Privacy Policy on GitHub</a> for the full document.</p>
        </div>
    </div>
</body>
</html>
EOF
    # Similar for other files...
fi
