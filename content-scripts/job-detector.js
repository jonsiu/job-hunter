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
    this.contextValidationInterval = null;
    this.urlCheckInterval = null;
    this.isRequestInProgress = false;
    this.initialize();
  }

  // Check if extension context is still valid
  isExtensionContextValid() {
    try {
      // Check if runtime.id exists - this is the most reliable way
      // After extension reload, runtime.id becomes undefined
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (error) {
      return false;
    }
  }

  initialize() {
    console.log('CareerOS Job Detector initialized');

    // Store current URL for comparison
    this.currentUrl = window.location.href;

    // Wait for page to load with delay for SPA content
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[CareerOS] DOMContentLoaded - waiting for SPA content...');
        this.waitForContentAndDetect();
      });
    } else {
      console.log('[CareerOS] Page already loaded - waiting for SPA content...');
      this.waitForContentAndDetect();
    }

    // Watch for URL changes (SPA navigation)
    this.observeUrlChanges();

    // Periodically check if extension context is still valid
    this.startContextValidation();
  }

  waitForContentAndDetect() {
    // For SPAs like LinkedIn, wait a bit for content to render
    console.log('[CareerOS] Waiting 2 seconds for dynamic content to load...');
    setTimeout(() => {
      console.log('[CareerOS] Wait complete, attempting job detection');
      this.detectJobPosting();
    }, 3000);
  }

  startContextValidation() {
    // Check every 30 seconds if extension context is still valid
    this.contextValidationInterval = setInterval(() => {
      if (!this.isExtensionContextValid()) {
        console.warn('Extension context invalidated, cleaning up');
        this.cleanup();
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
    console.log('[CareerOS] detectJobPosting() called');
    console.log('[CareerOS] Current URL:', window.location.href);

    const jobData = this.extractJobData();

    if (jobData) {
      console.log('[CareerOS] ✓ Job data extracted successfully');
      console.log('[CareerOS] Job title:', jobData.title);
      console.log('[CareerOS] Job company:', jobData.company);
      console.log('[CareerOS] Job source:', jobData.source);
      this.jobData = jobData;
      this.addBookmarkButton();
    } else {
      console.log('[CareerOS] ✗ No job posting detected on this page');
      console.log('[CareerOS] URL pattern did not match any known job boards');
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
      
      // --- NEW --- User-provided selector logic
      let location = null;
      let postedDate = null;
      const primaryDescriptionSelector = '#main > div > div.scaffold-layout__list-detail-inner.scaffold-layout__list-detail-inner--grow > div.scaffold-layout__detail.overflow-x-hidden.jobs-search__job-details > div > div.jobs-search__job-details--container > div > div.job-view-layout.jobs-details > div:nth-child(1) > div > div:nth-child(1) > div > div.relative.job-details-jobs-unified-top-card__container--two-pane > div > div.job-details-jobs-unified-top-card__primary-description-container';
      const primaryDescriptionContainer = document.querySelector(primaryDescriptionSelector);

      if (primaryDescriptionContainer) {
        parsingMetadata.selectors['primaryDescriptionContainer'] = {
            selector: primaryDescriptionSelector,
            success: true,
            method: 'user-provided'
        };
        const spans = primaryDescriptionContainer.querySelectorAll('span');
        if (spans.length > 0 && spans[0].textContent) {
            location = spans[0].textContent.trim();
            parsingMetadata.selectors['location'] = {
                selector: `${primaryDescriptionSelector} > span:nth-child(1)`,
                success: true,
                method: 'user-provided'
            };
        }
        if (spans.length > 2 && spans[2]) {
            const postedDateContainer = spans[2];
            let postedDateText = '';

            const nestedSpans = postedDateContainer.querySelectorAll('span');
            if (nestedSpans.length > 1 && nestedSpans[1].textContent) {
                postedDateText = nestedSpans[1].textContent.trim();
            } else {
                postedDateText = postedDateContainer.textContent.trim();
            }

            if (postedDateText) {
                postedDate = this.parsePostedDateText(postedDateText);
                parsingMetadata.selectors['postedDate'] = {
                    selector: `${primaryDescriptionSelector} > span:nth-child(3)`,
                    success: true,
                    method: 'user-provided-nested'
                };
            }
        }
      }
      // --- END NEW ---

      // Enhanced location extraction (fallback)
      if (!location) {
        const locationSelectors = [
          '.job-details-jobs-unified-top-card__bullet',
          '.job-details-jobs-unified-top-card__job-location',
          '.jobs-unified-top-card__job-location',
          '.job-location',
          '[data-test-id="job-location"]',
          '.location'
        ];
        location = this.extractWithFallbacks(locationSelectors, 'location', parsingMetadata);
      }

      // Enhanced posted date extraction (fallback)
      if (!postedDate) {
        const postedDateSelectors = [
          '.job-details-jobs-unified-top-card__primary-description',
          '.jobs-unified-top-card__posted-date',
          '.job-details-jobs-unified-top-card__posted-date',
          '[data-test-id="posted-time-ago"]',
          '.posted-time-ago__text',
          'span[class*="posted"]',
          'time[datetime]'
        ];
        postedDate = this.extractPostedDate(postedDateSelectors, parsingMetadata);
      }

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

      // Extract and sanitize HTML description
      const descriptionHtml = this.extractAndSanitizeHtml(descriptionSelectors);
      
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
        descriptionHtml: descriptionHtml, // NEW: Sanitized HTML description
        url: window.location.href,
        source: 'LinkedIn',
        postedDate: postedDate, // NEW: Posted date
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

  // NEW: Calculate extraction confidence with quality checks
  calculateExtractionConfidence(title, company, location, description) {
    let confidence = 0;

    // Title validation with quality checks
    if (title && title.length >= 3 && title.length <= 200) {
      confidence += 30;
      // Bonus for reasonable length
      if (title.length >= 10) confidence += 5;
    }

    // Company validation with quality checks
    if (company && company.length >= 2 && company.length <= 100) {
      confidence += 30;
      // Bonus for reasonable length
      if (company.length >= 3) confidence += 5;
    }

    // Location validation
    if (location && location.length >= 2 && location.length <= 100 && location !== 'Not specified') {
      confidence += 15;
    }

    // Description validation with meaningful content check
    if (description && description.length >= 100) {
      confidence += 15;
      // Bonus for substantial content
      if (description.length >= 500) confidence += 5;
    }

    return Math.min(confidence, 100);
  }

  // NEW: Extract posted date with fallback strategies
  extractPostedDate(selectors, metadata) {
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const element = document.querySelector(selector);

      if (element) {
        // Try to extract from datetime attribute first
        if (element.hasAttribute('datetime')) {
          const datetime = element.getAttribute('datetime');
          metadata.selectors['postedDate'] = {
            selector: selector,
            index: i,
            success: true,
            method: 'datetime-attribute'
          };
          return this.formatPostedDate(datetime);
        }

        // Try to extract from text content
        const text = element.textContent?.trim();
        if (text) {
          const postedDate = this.parsePostedDateText(text);
          if (postedDate) {
            metadata.selectors['postedDate'] = {
              selector: selector,
              index: i,
              success: true,
              method: 'text-parsing'
            };
            return postedDate;
          }
        }
      }
    }

    // No selector worked
    metadata.selectors['postedDate'] = {
      success: false,
      attemptedSelectors: selectors
    };

    return null;
  }

  // NEW: Parse posted date text (handles "Posted 2 days ago", "1 week ago", etc.)
  parsePostedDateText(text) {
    const lowerText = text.toLowerCase();

    // Handle relative time formats
    const relativePatterns = [
      { pattern: /(\d+)\s*(?:hour|hr)s?\s*ago/i, unit: 'hours' },
      { pattern: /(\d+)\s*(?:day|d)s?\s*ago/i, unit: 'days' },
      { pattern: /(\d+)\s*(?:week|wk|w)s?\s*ago/i, unit: 'weeks' },
      { pattern: /(\d+)\s*(?:month|mo)s?\s*ago/i, unit: 'months' }
    ];

    for (const { pattern, unit } of relativePatterns) {
      const match = text.match(pattern);
      if (match) {
        const value = parseInt(match[1]);
        return this.formatRelativeDate(value, unit);
      }
    }

    // Handle "today" and "yesterday"
    if (lowerText.includes('today') || lowerText.includes('just now')) {
      return 'Today';
    }
    if (lowerText.includes('yesterday')) {
      return 'Yesterday';
    }

    // Try to extract any date-like string
    const dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      return dateMatch[0];
    }

    return text.length < 50 ? text : null; // Return text if it's short enough
  }

  // NEW: Format relative date
  formatRelativeDate(value, unit) {
    if (value === 1) {
      const singularUnit = unit.slice(0, -1); // Remove 's'
      return `1 ${singularUnit} ago`;
    }
    return `${value} ${unit} ago`;
  }

  // NEW: Format posted date
  formatPostedDate(datetime) {
    try {
      const date = new Date(datetime);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      // Use Math.floor to avoid rounding up - 1 hour ago should not show as "1 day ago"
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
      }

      // Format as date if older
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
      console.error('Error formatting posted date:', error);
      return datetime;
    }
  }

  // NEW: Extract and sanitize HTML description
  extractAndSanitizeHtml(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        // Clone the element to avoid modifying the page
        const clone = element.cloneNode(true);

        // Remove script tags and event handlers
        const scripts = clone.querySelectorAll('script');
        scripts.forEach(script => script.remove());

        // Remove inline event handlers
        const allElements = clone.querySelectorAll('*');
        allElements.forEach(el => {
          // Remove on* attributes (onclick, onload, etc.)
          Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
              el.removeAttribute(attr.name);
            }
          });

          // Remove javascript: URLs
          if (el.hasAttribute('href') && el.getAttribute('href')?.startsWith('javascript:')) {
            el.removeAttribute('href');
          }
        });

        // Get clean HTML
        return clone.innerHTML;
      }
    }

    return null;
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

    for (const skill of commonSkills) {
      // Use word boundaries to avoid false matches
      // Handle special characters in skill names (e.g., Node.js)
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');

      if (regex.test(description)) {
        foundSkills.push(skill);
      }
    }

    return foundSkills;
  }

  addBookmarkButton() {
    // Check if extension context is still valid before adding button
    if (!this.isExtensionContextValid()) {
      return;
    }

    if (this.bookmarkButton) {
      this.bookmarkButton.remove();
    }

    // Create button element directly without wrapper div
    this.bookmarkButton = document.createElement('button');
    this.bookmarkButton.id = 'career-os-bookmark-btn';
    this.bookmarkButton.className = 'career-os-btn';
    this.bookmarkButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      Bookmark for CareerOS
    `;

    // Try to find a good place to insert the button
    const insertTarget = this.findInsertTarget();

    if (insertTarget) {
      insertTarget.appendChild(this.bookmarkButton);
    } else {
      // Fallback: add to top of page
      if (document.body && document.body.firstChild) {
        document.body.insertBefore(this.bookmarkButton, document.body.firstChild);
      } else {
        return;
      }
    }

    // Add click handler
    this.bookmarkButton.addEventListener('click', () => this.handleBookmarkClick());
  }

  findInsertTarget() {
    console.log('[CareerOS] findInsertTarget() called');

    // Try different selectors to find a good place for the button
    const selectors = [
      // LinkedIn - specific container for job details actions
      '#main > div > div.scaffold-layout__list-detail-inner.scaffold-layout__list-detail-inner--grow > div.scaffold-layout__detail.overflow-x-hidden.jobs-search__job-details > div > div.jobs-search__job-details--container > div > div.job-view-layout.jobs-details > div:nth-child(1) > div > div:nth-child(1) > div > div.relative.job-details-jobs-unified-top-card__container--two-pane > div > div.mt4 > div',
      // LinkedIn - more generic fallbacks
      'div.mt4', // LinkedIn actions container
      '.job-details-jobs-unified-top-card__job-title', // LinkedIn title
      '[data-testid="job-title"]', // Indeed
      '[data-test="job-title"]', // Glassdoor
      '.job-title', // Generic
      'h1' // Final fallback
    ];

    console.log('[CareerOS] Testing', selectors.length, 'selectors...');

    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      console.log(`[CareerOS] Trying selector ${i + 1}/${selectors.length}:`, selector);

      const element = document.querySelector(selector);

      if (element) {
        console.log(`[CareerOS] ✓ Selector matched! Element:`, element);
        console.log(`[CareerOS]   Tag: ${element.tagName}, Classes: ${element.className}`);

        // For the specific LinkedIn container, append directly
        if (selector.includes('mt4')) {
          console.log('[CareerOS] Using .mt4 container directly (no parent)');
          return element;
        }

        // For other selectors, use parent element
        if (element.parentElement) {
          console.log('[CareerOS] Using parent element:', element.parentElement);
          console.log(`[CareerOS]   Parent tag: ${element.parentElement.tagName}, Classes: ${element.parentElement.className}`);
          return element.parentElement;
        } else {
          console.warn('[CareerOS] Element found but has no parent');
        }
      } else {
        console.log(`[CareerOS] ✗ Selector not found`);
      }
    }

    console.error('[CareerOS] No valid insert target found after testing all selectors');
    return null;
  }

  handleBookmarkClick() {
    if (!this.jobData) {
      console.error('No job data to bookmark');
      return;
    }

    // Prevent multiple simultaneous requests
    if (this.isRequestInProgress) {
      console.log('Bookmark request already in progress');
      return;
    }

    // Check if extension context is still valid
    if (!this.isExtensionContextValid()) {
      this.showBookmarkError('Extension context invalidated. Please refresh the page.');
      return;
    }

    try {
      // Mark request as in progress and disable button
      this.isRequestInProgress = true;
      this.bookmarkButton.disabled = true;

      // Send message to background script
      chrome.runtime.sendMessage({
        action: 'bookmarkJob',
        jobData: this.jobData
      }, (response) => {
        // Reset request state
        this.isRequestInProgress = false;
        if (this.bookmarkButton) {
          this.bookmarkButton.disabled = false;
        }

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
      this.isRequestInProgress = false;
      if (this.bookmarkButton) {
        this.bookmarkButton.disabled = false;
      }
      this.showBookmarkError('Extension context invalidated. Please refresh the page.');
    }
  }

  showBookmarkSuccess() {
    if (!this.bookmarkButton) return;

    const originalText = this.bookmarkButton.innerHTML;
    
    this.bookmarkButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      Bookmarked!
    `;
    this.bookmarkButton.style.backgroundColor = '#10B981';
    this.bookmarkButton.disabled = true;

    setTimeout(() => {
      if (this.bookmarkButton) {
        this.bookmarkButton.innerHTML = originalText;
        this.bookmarkButton.style.backgroundColor = '';
        this.bookmarkButton.disabled = false;
      }
    }, 2000);
  }

  showBookmarkError(error) {
    console.error('Bookmark error:', error);
    // Could show a toast notification here
  }

  observeUrlChanges() {
    // Watch for URL changes in SPAs (pushState/replaceState)
    // This is far more efficient than watching DOM mutations

    let lastUrl = this.currentUrl;

    // Store original functions for cleanup
    this.originalPushState = history.pushState;
    this.originalReplaceState = history.replaceState;

    // Override pushState and replaceState to detect SPA navigation
    history.pushState = (...args) => {
      this.originalPushState.apply(history, args);
      this.handleUrlChange();
    };

    history.replaceState = (...args) => {
      this.originalReplaceState.apply(history, args);
      this.handleUrlChange();
    };

    // Store popstate handler for cleanup
    this.popstateHandler = () => {
      this.handleUrlChange();
    };

    // Also listen for popstate (back/forward buttons)
    window.addEventListener('popstate', this.popstateHandler);

    // Fallback: poll for URL changes (for edge cases)
    // This is more efficient than mutation observer as it only checks URL
    this.urlCheckInterval = setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        this.handleUrlChange();
      }
    }, 1000);
  }

  cleanup() {
    console.log('Cleaning up JobDetector resources');

    // Clear intervals
    if (this.contextValidationInterval) {
      clearInterval(this.contextValidationInterval);
      this.contextValidationInterval = null;
    }

    if (this.urlCheckInterval) {
      clearInterval(this.urlCheckInterval);
      this.urlCheckInterval = null;
    }

    // Remove popstate listener
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
    }

    // Restore original history methods
    if (this.originalPushState) {
      history.pushState = this.originalPushState;
      this.originalPushState = null;
    }

    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState;
      this.originalReplaceState = null;
    }

    // Remove bookmark button
    this.removeBookmarkButton();

    // Clear job data
    this.jobData = null;
  }

  handleUrlChange() {
    const newUrl = window.location.href;

    // Only re-detect if URL actually changed
    if (newUrl !== this.currentUrl) {
      console.log('[CareerOS] URL changed from:', this.currentUrl);
      console.log('[CareerOS] URL changed to:', newUrl);
      this.currentUrl = newUrl;

      // Wait longer for SPA to render new content (LinkedIn can be slow)
      console.log('[CareerOS] Waiting 2 seconds for new content to load...');
      setTimeout(() => {
        console.log('[CareerOS] Wait complete, attempting job detection after URL change');
        this.detectJobPosting();
      }, 2000);
    }
  }
}

// Initialize the job detector
new JobDetector();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { JobDetector };
}

} // End of initialization check
