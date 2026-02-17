#!/usr/bin/env python3
"""
Convert markdown files to HTML for GitHub Pages
"""

import os
import re
from path import Path

def markdown_to_html_simple(md_content, title):
    """Simple markdown to HTML converter"""
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - Tarot Deck App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <a href="index.html" class="back-link">← Back to Legal Documents</a>
"""
    
    # Convert markdown headers
    md_content = re.sub(r'^# (.+)$', r'<h1>\1</h1>', md_content, flags=re.MULTILINE)
    md_content = re.sub(r'^## (.+)$', r'<h2>\1</h2>', md_content, flags=re.MULTILINE)
    md_content = re.sub(r'^### (.+)$', r'<h3>\1</h3>', md_content, flags=re.MULTILINE)
    
    # Convert bold
    md_content = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', md_content)
    
    # Convert italic
    md_content = re.sub(r'\*(.+?)\*', r'<em>\1</em>', md_content)
    
    # Convert lists
    md_content = re.sub(r'^- (.+)$', r'<li>\1</li>', md_content, flags=re.MULTILINE)
    md_content = re.sub(r'(<li>.*</li>)', r'<ul>\1</ul>', md_content, flags=re.DOTALL)
    
    # Convert paragraphs
    lines = md_content.split('\n')
    paragraphs = []
    current_para = []
    
    for line in lines:
        if line.strip() == '':
            if current_para:
                paragraphs.append('<p>' + ' '.join(current_para) + '</p>')
                current_para = []
        elif not line.strip().startswith('<'):
            current_para.append(line.strip())
        else:
            if current_para:
                paragraphs.append('<p>' + ' '.join(current_para) + '</p>')
                current_para = []
            paragraphs.append(line)
    
    if current_para:
        paragraphs.append('<p>' + ' '.join(current_para) + '</p>')
    
    html += '\n'.join(paragraphs)
    
    html += """
        <footer>
            <p>Tarot Deck App © 2026</p>
        </footer>
    </div>
</body>
</html>
"""
    return html

def main():
    root_dir = Path(__file__).parent.parent
    
    files_to_convert = [
        ('PRIVACY_POLICY.md', 'Privacy Policy'),
        ('TERMS_OF_SERVICE.md', 'Terms of Service'),
        ('LICENSE', 'License'),
        ('COPYRIGHT', 'Copyright'),
    ]
    
    docs_dir = root_dir / 'docs'
    docs_dir.mkdir(exist_ok=True)
    
    for filename, title in files_to_convert:
        md_path = root_dir / filename
        html_filename = filename.replace('.md', '.html').replace('LICENSE', 'LICENSE.html').replace('COPYRIGHT', 'COPYRIGHT.html')
        html_path = docs_dir / html_filename
        
        if md_path.exists():
            with open(md_path, 'r', encoding='utf-8') as f:
                md_content = f.read()
            
            html_content = markdown_to_html_simple(md_content, title)
            
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            print(f"Converted {filename} to {html_filename}")
        else:
            print(f"Warning: {filename} not found")

if __name__ == '__main__':
    main()
