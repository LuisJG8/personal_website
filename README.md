# Personal Website

Welcome! This is a high-performance personal website built with HTML, Tailwind CSS, and JavaScript.

## Tech Stack

- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript** - Modern ES modules

## Project Structure

```
├── public/
│   ├── images/
│   │   └── profile.webp      # Profile image (replace with your own)
│   └── favicon.svg           # Site favicon
├── src/
│   ├── styles/
│   │   └── main.css          # Tailwind CSS styles
│   └── main.js               # JavaScript entry point
├── index.html                # Main HTML file
├── tailwind.config.js        # Tailwind configuration
└── vite.config.js            # Vite configuration
```

## Blog Integration (MKDocs)

This website is designed to work with MKDocs for the blog section. The navigation includes a `/blog/` link that can point to your MKDocs-generated blog.

### Recommended Setup

1. **Subdirectory approach**: Build MKDocs to `dist/blog/` after building the main site
2. **Separate deployment**: Deploy MKDocs to a `/blog` path on your hosting provider

### MKDocs Integration Script

Add to your build process:

```bash
# Build main site
npm run build

# Build MKDocs blog to dist/blog
cd blog && mkdocs build -d ../dist/blog
```

## Performance Optimizations

- ✅ Preconnect to Google Fonts
- ✅ Font display swap for better LCP
- ✅ Lazy loading for images
- ✅ WebP image format
- ✅ Minified CSS and JS
- ✅ Tree-shaking unused code
- ✅ Small bundle size with Tailwind purging

## Customization

1. **Profile Image**: Replace `public/images/profile.webp` with your photo (recommended: 160x160px WebP)
2. **Content**: Edit sections in `index.html`
3. **Colors**: Modify `tailwind.config.js` color palette
4. **Links**: Update social media and contact links

## License

MIT
