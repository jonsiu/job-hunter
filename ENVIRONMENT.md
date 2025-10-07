# CareerOS Job Collector - Environment Configuration

## Overview

The CareerOS Job Collector extension supports multiple environments with different configurations for CareerOS URL, debugging, and features. This ensures proper development, testing, and production deployment.

## Environment Types

### 1. Development Environment
- **CareerOS URL**: `http://localhost:3000`
- **Debug**: Enabled
- **Auto-detection**: Enabled
- **Features**: All enabled

### 2. Staging Environment
- **CareerOS URL**: `https://staging.career-os.vercel.app`
- **Debug**: Enabled
- **Auto-detection**: Disabled
- **Features**: All enabled

### 3. Production Environment
- **CareerOS URL**: `https://career-os.vercel.app`
- **Debug**: Disabled
- **Auto-detection**: Disabled
- **Features**: All enabled

## Configuration Methods

### Method 1: Build-Time Configuration (Recommended)

**For Development:**
```bash
npm run build:dev
```

**For Staging:**
```bash
npm run build:staging
```

**For Production:**
```bash
npm run build:prod
```

### Method 2: Runtime Configuration

The extension can auto-detect CareerOS URLs in development mode:

1. **Auto-detection** tries these URLs in order:
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `http://127.0.0.1:3000`
   - `http://127.0.0.1:3001`

2. **User override** through extension settings
3. **Fallback** to default environment configuration

### Method 3: Manual Configuration

Users can manually set the CareerOS URL in extension settings:

1. **Open extension settings**
2. **Navigate to "CareerOS Integration"**
3. **Enter custom URL**
4. **Test connection**

## Development Workflow

### Local Development Setup

1. **Start CareerOS locally:**
   ```bash
   cd career-os-app
   npm run dev
   # CareerOS runs on http://localhost:3000
   ```

2. **Build extension for development:**
   ```bash
   cd browser-extension
   npm run build:dev
   ```

3. **Load extension in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` directory

4. **Test auto-detection:**
   - Extension will automatically detect `http://localhost:3000`
   - Check extension settings to verify URL

### Environment Variables (Alternative)

You can also use environment variables for configuration:

```bash
# Set environment variable
export CAREER_OS_URL=http://localhost:3000

# Build with environment variable
npm run build:dev
```

## Configuration Files

### Environment Configuration (`src/config/environment.ts`)

```typescript
const configs = {
  development: {
    careerOSUrl: 'http://localhost:3000',
    apiEndpoint: 'http://localhost:3000/api',
    environment: 'development',
    debug: true,
    features: {
      autoAnalyze: true,
      notifications: true,
      syncWithCareerOS: true,
      advancedAnalysis: true,
    },
  },
  // ... other environments
};
```

### Settings Management (`src/config/settings.ts`)

```typescript
// Auto-detect CareerOS URL
const detectedUrl = await settingsManager.autoDetectCareerOSUrl();

// Update settings with detected URL
if (detectedUrl) {
  await settingsManager.updateSetting('careerOSUrl', detectedUrl);
}
```

## Best Practices

### 1. Development
- ✅ Use `npm run build:dev` for local development
- ✅ Enable auto-detection for convenience
- ✅ Use debug logging for troubleshooting
- ✅ Test with different CareerOS ports

### 2. Staging
- ✅ Use `npm run build:staging` for testing
- ✅ Disable auto-detection
- ✅ Enable debug logging for testing
- ✅ Test with staging CareerOS instance

### 3. Production
- ✅ Use `npm run build:prod` for deployment
- ✅ Disable debug logging
- ✅ Use production CareerOS URL
- ✅ Test thoroughly before deployment

## Troubleshooting

### Common Issues

**1. Extension can't connect to CareerOS**
- Check if CareerOS is running on the expected port
- Verify the URL in extension settings
- Test the connection using the "Test Connection" button

**2. Auto-detection not working**
- Ensure CareerOS is running and accessible
- Check browser console for errors
- Try manual configuration

**3. Wrong environment configuration**
- Rebuild with correct environment: `npm run build:dev`
- Check `dist/config/environment.json`
- Verify manifest.json permissions

### Debug Information

**Check environment configuration:**
```javascript
// In browser console
chrome.storage.local.get(['settings'], (result) => {
  console.log('Extension settings:', result.settings);
});
```

**Check build information:**
```javascript
// In browser console
fetch(chrome.runtime.getURL('build-info.json'))
  .then(response => response.json())
  .then(data => console.log('Build info:', data));
```

## Deployment

### Chrome Web Store

1. **Build for production:**
   ```bash
   npm run build:prod
   ```

2. **Package extension:**
   ```bash
   npm run package
   ```

3. **Upload to Chrome Web Store**

### Firefox Add-ons

1. **Build for production:**
   ```bash
   npm run build:prod
   ```

2. **Package as .zip:**
   ```bash
   npm run package
   ```

3. **Upload to Firefox Add-ons**

## Environment-Specific Features

### Development Features
- Auto-detection of CareerOS URL
- Debug logging enabled
- All features enabled
- Localhost permissions

### Staging Features
- Manual URL configuration
- Debug logging enabled
- All features enabled
- Staging URL permissions

### Production Features
- Manual URL configuration
- Debug logging disabled
- All features enabled
- Production URL permissions

## Security Considerations

### Development
- ✅ Localhost access allowed
- ✅ Debug information exposed
- ✅ Auto-detection enabled

### Production
- ❌ Localhost access blocked
- ❌ Debug information hidden
- ❌ Auto-detection disabled
- ✅ Only production URLs allowed

## Migration Guide

### From Hard-coded URLs

**Before:**
```javascript
const careerOSUrl = 'http://localhost:3000';
```

**After:**
```typescript
import { getConfigWithOverrides } from './config/environment';

const config = await getConfigWithOverrides();
const careerOSUrl = config.careerOSUrl;
```

### From Manual Configuration

**Before:**
```javascript
// Manual URL setting
chrome.storage.local.set({ careerOSUrl: 'http://localhost:3000' });
```

**After:**
```typescript
// Environment-aware configuration
const settings = await settingsManager.loadSettings();
const careerOSUrl = settings.careerOSUrl;
```

---

**Environment configuration ensures your extension works correctly across all deployment scenarios!** 🚀
