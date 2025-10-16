## Extension build and bundling

- **Build Tool**: Use webpack, Rollup, Vite, or Parcel for bundling
- **Multiple Contexts**: Bundle background, content scripts, popup separately
- **Code Splitting**: Split code into chunks; lazy load non-critical code
- **Tree Shaking**: Enable tree shaking to remove unused code
- **Minification**: Minify JS and CSS for production builds
- **Source Maps**: Generate source maps for debugging; exclude from production or use hidden
- **Asset Optimization**: Optimize images, compress SVGs, inline small assets
- **Environment Variables**: Support different configs for dev/staging/prod
- **Manifest Generation**: Generate manifest.json from template with build-time variables
- **Version Bumping**: Automate version number increments in manifest
- **Build Validation**: Validate manifest, check required files exist
- **TypeScript**: Compile TypeScript before bundling; include type checking
- **Browser-Specific Builds**: Create separate builds for Chrome, Firefox if needed
- **Watch Mode**: Support watch mode for development; hot reload when possible
