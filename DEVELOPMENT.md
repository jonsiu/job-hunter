# CareerOS Job Collector - Development Guide

## TypeScript Development Setup

This extension supports both **JavaScript** and **TypeScript** development. You can choose your preferred approach:

### Option 1: TypeScript Development (Recommended)

**Benefits:**
- ✅ Type safety and better IDE support
- ✅ Better refactoring and code navigation
- ✅ Catch errors at compile time
- ✅ Better IntelliSense and autocomplete

**Setup:**
```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Watch mode for development
npm run dev
```

**Development Workflow:**
1. Write TypeScript code in `src/` directory
2. Run `npm run dev` to watch for changes
3. Load the `dist/` directory in Chrome as an unpacked extension
4. TypeScript compiles to JavaScript automatically

### Option 2: JavaScript Development

**Benefits:**
- ✅ No build step required
- ✅ Direct browser loading
- ✅ Simpler for quick prototyping

**Setup:**
- Use the existing JavaScript files in the root directory
- Load directly in Chrome as unpacked extension

## Project Structure

### TypeScript Structure
```
browser-extension/
├── src/                          # TypeScript source files
│   ├── types/                    # Type definitions
│   │   └── index.ts
│   ├── background/               # Background script
│   │   └── background.ts
│   ├── content-scripts/          # Content scripts
│   ├── popup/                    # Popup interface
│   ├── options/                  # Settings page
│   └── manifest.json             # Extension manifest
├── dist/                         # Compiled JavaScript (generated)
├── assets/                       # Extension assets
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
└── README.md
```

### JavaScript Structure (Current)
```
browser-extension/
├── manifest.json                  # Extension manifest
├── background.js                  # Background script
├── content-scripts/               # Content scripts
├── popup/                        # Popup interface
├── options/                      # Settings page
├── assets/                       # Extension assets
└── README.md
```

## Development Commands

### TypeScript Commands
```bash
# Install dependencies
npm install

# Build once
npm run build

# Watch mode (rebuild on changes)
npm run dev

# Clean build directory
npm run clean

# Lint TypeScript code
npm run lint

# Package for distribution
npm run package
```

### JavaScript Commands
```bash
# No build step required
# Load directly in Chrome
```

## Browser Extension Development

### Chrome Extension Development

1. **Load Extension:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

2. **Development Tips:**
   - Use Chrome DevTools for debugging
   - Check `chrome://extensions/` for errors
   - Use `chrome.runtime.getManifest()` to verify manifest
   - Test on different job boards

### TypeScript Benefits for Extensions

1. **Type Safety:**
   ```typescript
   // Type-safe message handling
   chrome.runtime.onMessage.addListener((
     request: ExtensionMessage, 
     sender: chrome.runtime.MessageSender, 
     sendResponse: (response: ExtensionResponse) => void
   ) => {
     // TypeScript knows the structure of request and response
   });
   ```

2. **Better IDE Support:**
   - Autocomplete for Chrome APIs
   - Error detection before runtime
   - Better refactoring tools

3. **Chrome API Types:**
   ```typescript
   // Install @types/chrome for full Chrome API support
   npm install --save-dev @types/chrome
   ```

## Local Development Setup

### CareerOS Integration

Since CareerOS is running locally on `localhost:3000`:

1. **Update URLs** in the extension to point to local development
2. **Test API integration** with your local CareerOS instance
3. **Debug network requests** between extension and CareerOS

### CORS Considerations

For local development, you may need to configure CORS in your CareerOS app:

```javascript
// In your CareerOS Next.js app
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

## Testing

### Manual Testing

1. **Load the extension** in Chrome developer mode
2. **Visit job boards** (LinkedIn, Indeed, etc.)
3. **Test bookmarking** functionality
4. **Verify data storage** and retrieval
5. **Test popup interface** and settings

### Automated Testing (Future)

```typescript
// Example test structure
describe('Job Bookmarking', () => {
  it('should bookmark a job successfully', async () => {
    const jobData = mockJobData();
    const result = await bookmarkJob(jobData);
    expect(result.success).toBe(true);
  });
});
```

## Deployment

### Development Deployment

1. **Build TypeScript** (if using TS): `npm run build`
2. **Load unpacked** in Chrome
3. **Test thoroughly** on different job boards

### Production Deployment

1. **Build and package**: `npm run package`
2. **Upload to Chrome Web Store**
3. **Submit for review**

## Best Practices

### TypeScript Best Practices

1. **Use strict type checking**
2. **Define interfaces** for all data structures
3. **Use enums** for constants
4. **Handle errors** with proper typing

### Extension Best Practices

1. **Minimal permissions** - only request what you need
2. **Error handling** - graceful degradation
3. **User feedback** - clear success/error messages
4. **Performance** - efficient content script injection

### Code Organization

1. **Separate concerns** - background, content, popup
2. **Shared types** - common interfaces
3. **Utility functions** - reusable code
4. **Configuration** - centralized settings

## Troubleshooting

### Common Issues

1. **TypeScript compilation errors**
   - Check `tsconfig.json` configuration
   - Verify all imports are correct
   - Run `npm run build` to see errors

2. **Extension not loading**
   - Check manifest.json syntax
   - Verify file paths are correct
   - Check Chrome extension console for errors

3. **Content script not injecting**
   - Verify URL patterns in manifest
   - Check for JavaScript errors
   - Test on different job boards

### Debug Tools

1. **Chrome DevTools** - for popup and content script debugging
2. **Chrome Extension Console** - for background script debugging
3. **Network tab** - for API call debugging
4. **Storage tab** - for data persistence debugging

## Next Steps

1. **Choose development approach** (TypeScript or JavaScript)
2. **Set up development environment**
3. **Start with basic functionality**
4. **Add advanced features incrementally**
5. **Test thoroughly before deployment**

---

**Happy coding!** 🚀
