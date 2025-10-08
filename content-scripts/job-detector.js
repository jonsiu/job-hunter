// CareerOS Job Collector - Job Detection Content Script
// Detects job postings and adds bookmark functionality

// Prevent multiple initializations
if (window.careerOSJobDetector) {
  console.log('CareerOS Job Detector already initialized');
} else {
  window.careerOSJobDetector = true;

class JobDetector {
  constructor() {
    this.jobData = null;
    this.bookmarkButton = null;
    this.initialize();
  }

  // Check if extension context is still valid
  isExtensionContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.sendMessage);
    } catch (error) {
      return false;
    }
  }

  initialize() {
    console.log('CareerOS Job Detector initialized');
    
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.detectJobPosting());
    } else {
      this.detectJobPosting();
    }

    // Watch for dynamic content changes
    this.observePageChanges();
    
    // Periodically check if extension context is still valid
    this.startContextValidation();
  }

  startContextValidation() {
    // Check every 30 seconds if extension context is still valid
    setInterval(() => {
      if (!this.isExtensionContextValid()) {
        console.warn('Extension context invalidated, removing bookmark button');
        this.removeBookmarkButton();
      }
    }, 30000);
  }

  removeBookmarkButton() {
    if (this.bookmarkButton && this.bookmarkButton.parentElement) {
      this.bookmarkButton.parentElement.removeChild(this.bookmarkButton);
      this.bookmarkButton = null;
    }
  }

  detectJobPosting() {
    const jobData = this.extractJobData();
    
    if (jobData) {
      this.jobData = jobData;
      this.addBookmarkButton();
      console.log('Job detected:', jobData.title);
    } else {
      console.log('No job posting detected on this page');
    }
  }

  extractJobData() {
    const url = window.location.href;
    
    // Try different job board patterns
    if (url.includes('linkedin.com/jobs')) {
      return this.extractLinkedInJob();
    } else if (url.includes('indeed.com')) {
      return this.extractIndeedJob();
    } else if (url.includes('glassdoor.com')) {
      return this.extractGlassdoorJob();
    } else if (url.includes('angel.co')) {
      return this.extractAngelListJob();
    } else if (url.includes('stackoverflow.com/jobs')) {
      return this.extractStackOverflowJob();
    } else if (url.includes('remote.co')) {
      return this.extractRemoteCoJob();
    } else if (url.includes('weworkremotely.com')) {
      return this.extractWeWorkRemotelyJob();
    }
    
    return null;
  }

  extractLinkedInJob() {
    try {
      const parsingMetadata = {
        extractedAt: new Date().toISOString(),
        linkedInVersion: this.detectLinkedInVersion(),
        selectors: {},
        fallbackUsed: false,
        confidence: 0
      };

      // Enhanced title extraction with multiple fallback strategies
      const titleSelectors = [
        '.job-details-jobs-unified-top-card__job-title',
        'h1[data-test-id="job-title"]',
        '.job-details-jobs-unified-top-card__job-title-text',
        '.jobs-unified-top-card__job-title',
        '.job-details-jobs-unified-top-card__job-title-link',
        'h1.job-title',
        '[data-test-id="job-title"]',
        '.job-title'
      ];
      
      const title = this.extractWithFallbacks(titleSelectors, 'title', parsingMetadata);
      
      // Enhanced company extraction with multiple fallback strategies
      const companySelectors = [
        '.job-details-jobs-unified-top-card__company-name',
        'a[data-test-id="job-company-name"]',
        '.job-details-jobs-unified-top-card__company-name-text',
        '.jobs-unified-top-card__company-name',
        '.job-details-jobs-unified-top-card__company-name-link',
        '.company-name',
        '[data-test-id="company-name"]',
        '.employer-name'
      ];
      
      const company = this.extractWithFallbacks(companySelectors, 'company', parsingMetadata);
      
      // Enhanced location extraction
      const locationSelectors = [
        '.job-details-jobs-unified-top-card__bullet',
        '.job-details-jobs-unified-top-card__job-location',
        '.jobs-unified-top-card__job-location',
        '.job-location',
        '[data-test-id="job-location"]',
        '.location'
      ];
      
      const location = this.extractWithFallbacks(locationSelectors, 'location', parsingMetadata);
      
      // Enhanced description extraction with raw HTML storage
      const descriptionSelectors = [
        '.jobs-description-content__text',
        '.jobs-box__html-content',
        '[data-test-id="job-description"]',
        '.job-description',
        '.jobs-description',
        '.description-content',
        '.job-details-jobs-unified-top-card__job-description'
      ];
      
      const description = this.extractWithFallbacks(descriptionSelectors, 'description', parsingMetadata);
      
      // Store raw HTML for offline re-parsing
      const rawJobDescriptionHtml = this.extractRawJobDescriptionHtml();
      
      if (!title || !company) {
        parsingMetadata.confidence = 0;
        return null;
      }

      // Calculate confidence based on successful extractions
      parsingMetadata.confidence = this.calculateExtractionConfidence(title, company, location, description);

      const jobData = {
        title: title.trim(),
        company: company.trim(),
        location: location?.trim() || 'Not specified',
        description: description?.trim() || '',
        url: window.location.href,
        source: 'LinkedIn',
        salary: this.extractSalary(),
        remote: this.detectRemoteWork(),
        requirements: this.extractRequirements(description),
        skills: this.extractSkills(description),
        // NEW: Raw HTML storage for offline re-parsing
        rawJobDescriptionHtml: rawJobDescriptionHtml,
        // NEW: Parsing metadata tracking
        parsingMetadata: parsingMetadata
      };

      console.log('LinkedIn job extracted with confidence:', parsingMetadata.confidence, parsingMetadata);
      return jobData;
    } catch (error) {
      console.error('Error extracting LinkedIn job:', error);
      return null;
    }
  }

  extractIndeedJob() {
    try {
      const title = this.getTextContent('h1[data-testid="job-title"]') ||
                   this.getTextContent('.jobsearch-JobInfoHeader-title');
      
      const company = this.getTextContent('[data-testid="company-name"]') ||
                     this.getTextContent('.jobsearch-CompanyInfoContainer');
      
      const location = this.getTextContent('[data-testid="job-location"]') ||
                      this.getTextContent('.jobsearch-JobInfoHeader-subtitle');
      
      const description = this.getTextContent('#jobDescriptionText') ||
                         this.getTextContent('.jobsearch-jobDescriptionText');

      if (!title || !company) return null;

      return {
        title: title.trim(),
        company: company.trim(),
        location: location?.trim() || 'Not specified',
        description: description?.trim() || '',
        url: window.location.href,
        source: 'Indeed',
        salary: this.extractSalary(),
        remote: this.detectRemoteWork(),
        requirements: this.extractRequirements(description),
        skills: this.extractSkills(description)
      };
    } catch (error) {
      console.error('Error extracting Indeed job:', error);
      return null;
    }
  }

  extractGlassdoorJob() {
    try {
      const title = this.getTextContent('[data-test="job-title"]') ||
                   this.getTextContent('.jobTitle');
      
      const company = this.getTextContent('[data-test="employer-name"]') ||
                     this.getTextContent('.employerName');
      
      const location = this.getTextContent('[data-test="job-location"]') ||
                      this.getTextContent('.jobLocation');
      
      const description = this.getTextContent('[data-test="job-description"]') ||
                         this.getTextContent('.jobDescriptionContent');

      if (!title || !company) return null;

      return {
        title: title.trim(),
        company: company.trim(),
        location: location?.trim() || 'Not specified',
        description: description?.trim() || '',
        url: window.location.href,
        source: 'Glassdoor',
        salary: this.extractSalary(),
        remote: this.detectRemoteWork(),
        requirements: this.extractRequirements(description),
        skills: this.extractSkills(description)
      };
    } catch (error) {
      console.error('Error extracting Glassdoor job:', error);
      return null;
    }
  }

  extractAngelListJob() {
    try {
      const title = this.getTextContent('h1') ||
                   this.getTextContent('.job-title');
      
      const company = this.getTextContent('.company-name') ||
                     this.getTextContent('[data-test="company-name"]');
      
      const location = this.getTextContent('.location') ||
                      this.getTextContent('[data-test="job-location"]');
      
      const description = this.getTextContent('.job-description') ||
                         this.getTextContent('[data-test="job-description"]');

      if (!title || !company) return null;

      return {
        title: title.trim(),
        company: company.trim(),
        location: location?.trim() || 'Not specified',
        description: description?.trim() || '',
        url: window.location.href,
        source: 'AngelList',
        salary: this.extractSalary(),
        remote: this.detectRemoteWork(),
        requirements: this.extractRequirements(description),
        skills: this.extractSkills(description)
      };
    } catch (error) {
      console.error('Error extracting AngelList job:', error);
      return null;
    }
  }

  extractStackOverflowJob() {
    try {
      const title = this.getTextContent('h1') ||
                   this.getTextContent('.job-title');
      
      const company = this.getTextContent('.company-name') ||
                     this.getTextContent('[data-test="company-name"]');
      
      const location = this.getTextContent('.location') ||
                      this.getTextContent('[data-test="job-location"]');
      
      const description = this.getTextContent('.job-description') ||
                         this.getTextContent('[data-test="job-description"]');

      if (!title || !company) return null;

      return {
        title: title.trim(),
        company: company.trim(),
        location: location?.trim() || 'Not specified',
        description: description?.trim() || '',
        url: window.location.href,
        source: 'Stack Overflow',
        salary: this.extractSalary(),
        remote: this.detectRemoteWork(),
        requirements: this.extractRequirements(description),
        skills: this.extractSkills(description)
      };
    } catch (error) {
      console.error('Error extracting Stack Overflow job:', error);
      return null;
    }
  }

  extractRemoteCoJob() {
    try {
      const title = this.getTextContent('h1') ||
                   this.getTextContent('.job-title');
      
      const company = this.getTextContent('.company-name') ||
                     this.getTextContent('[data-test="company-name"]');
      
      const location = 'Remote';
      
      const description = this.getTextContent('.job-description') ||
                         this.getTextContent('[data-test="job-description"]');

      if (!title || !company) return null;

      return {
        title: title.trim(),
        company: company.trim(),
        location: location,
        description: description?.trim() || '',
        url: window.location.href,
        source: 'Remote.co',
        salary: this.extractSalary(),
        remote: true,
        requirements: this.extractRequirements(description),
        skills: this.extractSkills(description)
      };
    } catch (error) {
      console.error('Error extracting Remote.co job:', error);
      return null;
    }
  }

  extractWeWorkRemotelyJob() {
    try {
      const title = this.getTextContent('h1') ||
                   this.getTextContent('.job-title');
      
      const company = this.getTextContent('.company-name') ||
                     this.getTextContent('[data-test="company-name"]');
      
      const location = 'Remote';
      
      const description = this.getTextContent('.job-description') ||
                         this.getTextContent('[data-test="job-description"]');

      if (!title || !company) return null;

      return {
        title: title.trim(),
        company: company.trim(),
        location: location,
        description: description?.trim() || '',
        url: window.location.href,
        source: 'We Work Remotely',
        salary: this.extractSalary(),
        remote: true,
        requirements: this.extractRequirements(description),
        skills: this.extractSkills(description)
      };
    } catch (error) {
      console.error('Error extracting We Work Remotely job:', error);
      return null;
    }
  }

  getTextContent(selector) {
    const element = document.querySelector(selector);
    return element ? element.textContent : null;
  }

  // NEW: Enhanced extraction with fallback strategies
  extractWithFallbacks(selectors, fieldName, metadata) {
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const element = document.querySelector(selector);
      
      if (element && element.textContent && element.textContent.trim()) {
        metadata.selectors[fieldName] = {
          selector: selector,
          index: i,
          success: true
        };
        
        // Mark as fallback if not the first selector
        if (i > 0) {
          metadata.fallbackUsed = true;
        }
        
        return element.textContent.trim();
      }
    }
    
    // No selector worked
    metadata.selectors[fieldName] = {
      success: false,
      attemptedSelectors: selectors
    };
    
    return null;
  }

  // NEW: Detect LinkedIn version for metadata tracking
  detectLinkedInVersion() {
    // Try to detect LinkedIn's current version/design
    if (document.querySelector('.jobs-unified-top-card')) {
      return 'unified-top-card';
    } else if (document.querySelector('.job-details-jobs-unified-top-card')) {
      return 'job-details-unified';
    } else if (document.querySelector('[data-test-id="job-title"]')) {
      return 'test-id-based';
    } else {
      return 'legacy';
    }
  }

  // NEW: Extract raw HTML for offline re-parsing
  extractRawJobDescriptionHtml() {
    const descriptionSelectors = [
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '[data-test-id="job-description"]',
      '.job-description',
      '.jobs-description',
      '.description-content',
      '.job-details-jobs-unified-top-card__job-description'
    ];

    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.outerHTML;
      }
    }
    
    return null;
  }

  // NEW: Calculate extraction confidence
  calculateExtractionConfidence(title, company, location, description) {
    let confidence = 0;
    
    if (title && title.length > 0) confidence += 30;
    if (company && company.length > 0) confidence += 30;
    if (location && location.length > 0) confidence += 20;
    if (description && description.length > 50) confidence += 20;
    
    return Math.min(confidence, 100);
  }

  extractSalary() {
    const salaryPatterns = [
      /\$[\d,]+(?:-\$[\d,]+)?(?:k|K)?/g,
      /[\d,]+(?:-\d+)?(?:k|K)?\s*(?:per\s+year|annually|yearly)/gi,
      /salary[:\s]*\$?[\d,]+(?:-\$?[\d,]+)?/gi
    ];

    const text = document.body.textContent;
    
    for (const pattern of salaryPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }
    
    return null;
  }

  detectRemoteWork() {
    const remoteKeywords = ['remote', 'work from home', 'wfh', 'distributed', 'virtual'];
    const text = document.body.textContent.toLowerCase();
    
    return remoteKeywords.some(keyword => text.includes(keyword));
  }

  extractRequirements(description) {
    if (!description) return [];
    
    const requirementPatterns = [
      /(?:required|must have|need|requirement)[:\s]*([^.]+)/gi,
      /(?:experience|years?)[:\s]*(\d+[+\-]?\s*(?:years?|yrs?))/gi,
      /(?:degree|education)[:\s]*([^.]+)/gi
    ];

    const requirements = [];
    
    for (const pattern of requirementPatterns) {
      const matches = description.match(pattern);
      if (matches) {
        requirements.push(...matches);
      }
    }
    
    return requirements.slice(0, 10); // Limit to 10 requirements
  }

  extractSkills(description) {
    if (!description) return [];
    
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript',
      'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'PostgreSQL',
      'Git', 'Agile', 'Scrum', 'Machine Learning', 'AI', 'Data Science',
      'Frontend', 'Backend', 'Full Stack', 'DevOps', 'Cloud Computing'
    ];

    const foundSkills = [];
    const lowerDescription = description.toLowerCase();
    
    for (const skill of commonSkills) {
      if (lowerDescription.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }
    
    return foundSkills;
  }

  addBookmarkButton() {
    // Check if extension context is still valid before adding button
    if (!this.isExtensionContextValid()) {
      console.warn('Extension context invalidated, not adding bookmark button');
      return;
    }

    if (this.bookmarkButton) {
      this.bookmarkButton.remove();
    }

    this.bookmarkButton = document.createElement('div');
    this.bookmarkButton.id = 'career-os-bookmark-button';
    this.bookmarkButton.innerHTML = `
      <button id="career-os-bookmark-btn" class="career-os-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        Bookmark for CareerOS
      </button>
    `;

    // Try to find a good place to insert the button
    const insertTarget = this.findInsertTarget();
    if (insertTarget) {
      insertTarget.appendChild(this.bookmarkButton);
    } else {
      // Fallback: add to top of page
      document.body.insertBefore(this.bookmarkButton, document.body.firstChild);
    }

    // Add click handler
    const button = this.bookmarkButton.querySelector('#career-os-bookmark-btn');
    button.addEventListener('click', () => this.handleBookmarkClick());
  }

  findInsertTarget() {
    // Try different selectors to find a good place for the button
    const selectors = [
      '.job-details-jobs-unified-top-card__job-title', // LinkedIn
      '[data-testid="job-title"]', // Indeed
      '[data-test="job-title"]', // Glassdoor
      '.job-title', // Generic
      'h1' // Fallback
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.parentElement) {
        return element.parentElement;
      }
    }

    return null;
  }

  handleBookmarkClick() {
    if (!this.jobData) {
      console.error('No job data to bookmark');
      return;
    }

    // Check if extension context is still valid
    if (!this.isExtensionContextValid()) {
      this.showBookmarkError('Extension context invalidated. Please refresh the page.');
      return;
    }

    try {

      // Send message to background script
      chrome.runtime.sendMessage({
        action: 'bookmarkJob',
        jobData: this.jobData
      }, (response) => {
        // Check for runtime errors
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          this.showBookmarkError('Extension error: ' + chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          this.showBookmarkSuccess();
        } else {
          this.showBookmarkError(response?.error || 'Failed to bookmark job');
        }
      });
    } catch (error) {
      console.error('Error sending message to background script:', error);
      this.showBookmarkError('Extension context invalidated. Please refresh the page.');
    }
  }

  showBookmarkSuccess() {
    const button = this.bookmarkButton.querySelector('#career-os-bookmark-btn');
    const originalText = button.innerHTML;
    
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      Bookmarked!
    `;
    button.style.backgroundColor = '#10B981';
    button.disabled = true;

    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.backgroundColor = '';
      button.disabled = false;
    }, 2000);
  }

  showBookmarkError(error) {
    console.error('Bookmark error:', error);
    // Could show a toast notification here
  }

  observePageChanges() {
    // Watch for dynamic content changes (SPA navigation)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if we're on a new job page
          setTimeout(() => {
            const newJobData = this.extractJobData();
            if (newJobData && (!this.jobData || newJobData.url !== this.jobData.url)) {
              this.detectJobPosting();
            }
          }, 1000);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize the job detector
new JobDetector();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { JobDetector };
}

} // End of initialization check
