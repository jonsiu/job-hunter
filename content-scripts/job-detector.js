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
      const title = this.getTextContent('.job-details-jobs-unified-top-card__job-title') ||
                   this.getTextContent('h1[data-test-id="job-title"]') ||
                   this.getTextContent('.job-details-jobs-unified-top-card__job-title-text');
      
      const company = this.getTextContent('.job-details-jobs-unified-top-card__company-name') ||
                     this.getTextContent('a[data-test-id="job-company-name"]') ||
                     this.getTextContent('.job-details-jobs-unified-top-card__company-name-text');
      
      const location = this.getTextContent('.job-details-jobs-unified-top-card__bullet') ||
                      this.getTextContent('.job-details-jobs-unified-top-card__job-location');
      
      const description = this.getTextContent('.jobs-description-content__text') ||
                         this.getTextContent('.jobs-box__html-content') ||
                         this.getTextContent('[data-test-id="job-description"]');

      if (!title || !company) return null;

      return {
        title: title.trim(),
        company: company.trim(),
        location: location?.trim() || 'Not specified',
        description: description?.trim() || '',
        url: window.location.href,
        source: 'LinkedIn',
        salary: this.extractSalary(),
        remote: this.detectRemoteWork(),
        requirements: this.extractRequirements(description),
        skills: this.extractSkills(description)
      };
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

    // Send message to background script
    chrome.runtime.sendMessage({
      action: 'bookmarkJob',
      jobData: this.jobData
    }, (response) => {
      if (response && response.success) {
        this.showBookmarkSuccess();
      } else {
        this.showBookmarkError(response?.error || 'Failed to bookmark job');
      }
    });
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

} // End of initialization check
