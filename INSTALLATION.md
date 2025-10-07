# CareerOS Job Collector - Installation Guide

## Quick Start

### 1. Download the Extension
- Download or clone this repository
- Extract the files to a local directory

### 2. Load in Chrome (Development Mode)

1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer Mode** by toggling the switch in the top-right corner
3. **Click "Load unpacked"** and select the extension directory
4. **Verify installation** - you should see the CareerOS Job Collector icon in your toolbar

### 3. Test the Extension

1. **Visit a job board** (LinkedIn Jobs, Indeed, Glassdoor, etc.)
2. **Look for the bookmark button** - you should see a "Bookmark for CareerOS" button
3. **Click the extension icon** to view your bookmarked jobs
4. **Configure settings** by right-clicking the extension icon and selecting "Options"

## Supported Job Boards

The extension works on the following job boards:

- **LinkedIn Jobs** - `linkedin.com/jobs`
- **Indeed** - `indeed.com`
- **Glassdoor** - `glassdoor.com`
- **AngelList** - `angel.co`
- **Stack Overflow Jobs** - `stackoverflow.com/jobs`
- **Remote.co** - `remote.co`
- **We Work Remotely** - `weworkremotely.com`

## First-Time Setup

### 1. Configure Settings

1. **Right-click the extension icon** and select "Options"
2. **Set your preferences**:
   - Enable/disable auto-analysis
   - Configure notifications
   - Set CareerOS URL (default: https://career-os.vercel.app)
   - Select which job boards to monitor

### 2. Connect to CareerOS (Optional)

1. **Open CareerOS** in your browser
2. **Sign in** to your CareerOS account
3. **Copy your CareerOS URL** from the address bar
4. **Paste the URL** in the extension settings
5. **Test the connection** to ensure sync is working

## Usage

### Bookmarking Jobs

1. **Navigate to any job posting** on a supported job board
2. **Look for the blue "Bookmark for CareerOS" button** (usually in the top-right)
3. **Click the button** to save the job
4. **The button will show "Bookmarked!"** to confirm

### Managing Your Jobs

1. **Click the extension icon** in your toolbar
2. **View your bookmarked jobs** in the "Jobs" tab
3. **Analyze jobs** by clicking the analysis button
4. **View insights** in the "Insights" tab

### Syncing with CareerOS

1. **Click the sync button** in the extension popup
2. **Your jobs will sync** with your CareerOS account
3. **View detailed analysis** on the CareerOS website

## Troubleshooting

### Extension Not Working

**Problem**: Extension icon doesn't appear or bookmark button doesn't show up

**Solutions**:
- Refresh the job board page
- Check if the job board is supported
- Verify extension permissions
- Try disabling and re-enabling the extension

### Jobs Not Syncing

**Problem**: Jobs aren't syncing with CareerOS

**Solutions**:
- Check your internet connection
- Verify the CareerOS URL in settings
- Ensure you're signed in to CareerOS
- Test the connection in settings

### Bookmark Button Not Appearing

**Problem**: The bookmark button doesn't appear on job pages

**Solutions**:
- Wait a few seconds for the page to load completely
- Check if the job board is supported
- Try refreshing the page
- Check browser console for errors

### Data Not Saving

**Problem**: Bookmarked jobs aren't being saved

**Solutions**:
- Check browser storage permissions
- Clear browser cache and cookies
- Try bookmarking a different job
- Check if storage quota is full

## Browser Compatibility

### Chrome (Recommended)
- **Version**: 88+ (Manifest V3 support)
- **Installation**: Load unpacked extension
- **Features**: Full feature support

### Firefox
- **Version**: 78+ (WebExtensions)
- **Installation**: Load temporary add-on
- **Features**: Most features supported

### Edge
- **Version**: 88+ (Chromium-based)
- **Installation**: Load unpacked extension
- **Features**: Full feature support

## Development

### For Developers

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd browser-extension
   ```

2. **Make changes** to the extension files

3. **Reload the extension** in Chrome:
   - Go to `chrome://extensions/`
   - Click the refresh button on the extension

4. **Test your changes** on job boards

### Building for Production

1. **Package the extension**:
   ```bash
   npm run package
   ```

2. **Upload to browser stores**:
   - Chrome Web Store
   - Firefox Add-ons
   - Microsoft Edge Add-ons

## Support

### Getting Help

- **Documentation**: Check the README.md file
- **Issues**: Report bugs on GitHub
- **CareerOS Support**: Contact through the CareerOS website

### Common Questions

**Q: Can I use this extension without a CareerOS account?**
A: Yes, the extension works independently and stores data locally. CareerOS integration is optional.

**Q: Is my data secure?**
A: Yes, all data is stored locally in your browser and encrypted when syncing with CareerOS.

**Q: Can I export my bookmarked jobs?**
A: Yes, use the "Export Data" option in the extension settings.

**Q: Does the extension work offline?**
A: Yes, you can bookmark jobs offline. Analysis and sync require an internet connection.

## Uninstallation

### Remove the Extension

1. **Go to** `chrome://extensions/`
2. **Find** CareerOS Job Collector
3. **Click** "Remove"
4. **Confirm** removal

### Clear Data (Optional)

1. **Open extension settings** before removal
2. **Click** "Clear All Data"
3. **Confirm** data deletion

---

**CareerOS Job Collector** - Making job hunting more intelligent and personalized.
