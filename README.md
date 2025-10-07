# CareerOS Job Collector Browser Extension

A powerful browser extension that allows users to collect and analyze jobs they're interested in, providing personalized career insights and resume optimization.

## Features

### 🎯 Job Bookmarking
- One-click bookmarking from major job boards
- Automatic job data extraction
- Support for LinkedIn, Indeed, Glassdoor, AngelList, and more

### 📊 Job Analysis
- Skills extraction from job descriptions
- Requirements analysis and gap identification
- Salary benchmarking
- Application readiness scoring

### 🚀 Resume Optimization
- Job-specific resume recommendations
- Keyword optimization suggestions
- Experience positioning advice
- Skills highlighting recommendations

### 💡 Career Insights
- Career progression analysis
- Skill development recommendations
- Industry trend insights
- Personalized career guidance

## Supported Job Boards

- **LinkedIn Jobs** - Professional networking and job opportunities
- **Indeed** - Comprehensive job search platform
- **Glassdoor** - Company reviews and job listings
- **AngelList** - Startup and tech jobs
- **Stack Overflow Jobs** - Developer-focused opportunities
- **Remote.co** - Remote work opportunities
- **We Work Remotely** - Remote job board

## Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd browser-extension
   ```

2. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension directory

3. **Test the extension**
   - Visit any supported job board
   - Look for the "Bookmark for CareerOS" button
   - Click the extension icon to manage bookmarked jobs

### Production Installation

The extension will be available on:
- Chrome Web Store
- Firefox Add-ons
- Microsoft Edge Add-ons

## Usage

### Bookmarking Jobs

1. **Navigate to a job posting** on any supported job board
2. **Click the "Bookmark for CareerOS" button** that appears on the page
3. **Job is automatically saved** to your collection

### Managing Jobs

1. **Click the extension icon** in your browser toolbar
2. **View your bookmarked jobs** in the Jobs tab
3. **Analyze jobs** to get insights and recommendations
4. **View career insights** based on your job collection

### Settings

1. **Click the extension icon** and go to Settings
2. **Configure preferences**:
   - Auto-analyze jobs
   - Enable notifications
   - Sync with CareerOS
   - Select supported job boards

## Technical Architecture

### Extension Structure
```
browser-extension/
├── manifest.json          # Extension manifest
├── background.js           # Background service worker
├── content-scripts/        # Content scripts for job detection
│   ├── job-detector.js    # Job detection and bookmarking
│   └── job-detector.css   # Styling for job detection
├── popup/                 # Extension popup interface
│   ├── popup.html         # Popup HTML
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup functionality
├── options/               # Settings page
│   ├── options.html       # Settings HTML
│   ├── options.css        # Settings styles
│   └── options.js         # Settings functionality
└── assets/                # Extension assets
    └── icons/             # Extension icons
```

### Data Flow

1. **Job Detection**: Content script detects job postings on supported sites
2. **Bookmarking**: User clicks bookmark button, job data is extracted and saved
3. **Analysis**: Background script analyzes job data and generates insights
4. **Storage**: Data is stored locally and synced with CareerOS
5. **Display**: Popup interface shows jobs, analysis, and insights

## Development

### Prerequisites

- Node.js (for build tools, if needed)
- Chrome/Chromium browser
- Basic knowledge of JavaScript, HTML, CSS

### Building

The extension is built with vanilla JavaScript and doesn't require a build process. However, you can add build tools for:

- TypeScript compilation
- CSS preprocessing
- Asset optimization
- Code minification

### Testing

1. **Load the extension** in developer mode
2. **Test on different job boards** to ensure compatibility
3. **Verify data storage** and synchronization
4. **Check popup functionality** and user interface

### Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## Privacy & Security

### Data Collection
- **Minimal data**: Only collect data necessary for functionality
- **User consent**: Clear consent for data collection and usage
- **Data retention**: Clear policies for data retention and deletion
- **User control**: Users can delete their data at any time

### Security Measures
- **Encryption**: All data encrypted in transit and at rest
- **Authentication**: Secure authentication with CareerOS
- **Permissions**: Minimal permissions requested
- **Updates**: Regular security updates and patches

## Browser Compatibility

- **Chrome**: Primary target (Manifest V3)
- **Firefox**: Secondary target (WebExtensions)
- **Edge**: Tertiary target (Chromium-based)
- **Safari**: Future consideration

## API Integration

The extension integrates with the CareerOS web application through:

- **Job synchronization**: Bookmarked jobs sync with CareerOS
- **Analysis results**: Analysis data is shared between platforms
- **User profile**: User settings and preferences sync
- **Career insights**: Insights are generated using CareerOS data

## Troubleshooting

### Common Issues

1. **Extension not working on job boards**
   - Check if the job board is supported
   - Verify extension permissions
   - Try refreshing the page

2. **Jobs not syncing with CareerOS**
   - Check CareerOS URL in settings
   - Verify internet connection
   - Check CareerOS account status

3. **Analysis not working**
   - Ensure auto-analyze is enabled
   - Check job data completeness
   - Verify CareerOS integration

### Getting Help

- **Documentation**: Check the CareerOS documentation
- **Support**: Contact support through CareerOS
- **Issues**: Report bugs through GitHub issues

## Roadmap

### Phase 1: Core Extension ✅
- [x] Extension manifest and basic structure
- [x] Job bookmarking functionality
- [x] Data storage and synchronization
- [x] Basic UI for job management

### Phase 2: Job Analysis (In Progress)
- [ ] Skills extraction from job descriptions
- [ ] Requirements analysis
- [ ] Salary benchmarking integration
- [ ] Company culture assessment

### Phase 3: Resume Optimization (Planned)
- [ ] Job-specific resume recommendations
- [ ] Keyword optimization suggestions
- [ ] Experience positioning advice
- [ ] Skills highlighting recommendations

### Phase 4: Career Insights (Planned)
- [ ] Career progression analysis
- [ ] Skill development recommendations
- [ ] Industry trend insights
- [ ] Networking opportunities

### Phase 5: Polish & Launch (Planned)
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Browser store submissions
- [ ] User onboarding and documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- CareerOS team for the web application
- Browser extension community for best practices
- Job board platforms for providing access to job data
- Users for feedback and suggestions

---

**CareerOS Job Collector** - Making job hunting more intelligent and personalized.
