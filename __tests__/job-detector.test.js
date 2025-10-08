// CareerOS Job Collector - Job Detection Tests
// Comprehensive unit tests for all parsing strategies

describe('JobDetector', () => {
  let jobDetector;
  let mockDocument;

  let JobDetectorClass;
  
  beforeAll(() => {
    // Mock chrome API
    global.chrome = {
      runtime: { sendMessage: jest.fn() }
    };
    
    // Mock document.querySelector
    jest.spyOn(document, 'querySelector').mockImplementation(() => null);
    
    // Set window properties
    global.window.careerOSJobDetector = false;
    
    // Load the module once
    const { JobDetector } = require('../content-scripts/job-detector.js');
    JobDetectorClass = JobDetector;
  });

  beforeEach(() => {
    // Keep reference to mockDocument
    mockDocument = global.document;
    
    // Create fresh instance for each test
    jobDetector = Object.create(JobDetectorClass.prototype);
    jobDetector.jobData = null;
    jobDetector.bookmarkButton = null;
  });

  describe('LinkedIn Job Parsing', () => {
    describe('Title Extraction', () => {
      test('should extract title using primary selector', () => {
        document.querySelector.mockImplementation((selector) => {
          if (selector === '.job-details-jobs-unified-top-card__job-title') {
            return { textContent: 'Senior Software Engineer' };
          }
          if (selector === '.job-details-jobs-unified-top-card__company-name') {
            return { textContent: 'Google' };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result.title).toBe('Senior Software Engineer');
        expect(result.parsingMetadata.selectors.title.success).toBe(true);
        expect(result.parsingMetadata.selectors.title.index).toBe(0);
      });

      test('should fallback to secondary selector when primary fails', () => {
        document.querySelector.mockImplementation((selector) => {
          if (selector === 'h1[data-test-id="job-title"]') {
            return { textContent: 'Senior Software Engineer' };
          }
          if (selector === 'a[data-test-id="job-company-name"]') {
            return { textContent: 'Google' };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result.title).toBe('Senior Software Engineer');
        expect(result.parsingMetadata.selectors.title.index).toBe(1);
        expect(result.parsingMetadata.fallbackUsed).toBe(true);
      });

      test('should try all title selectors in order', () => {
        const selectors = [
          '.job-details-jobs-unified-top-card__job-title',
          'h1[data-test-id="job-title"]',
          '.job-details-jobs-unified-top-card__job-title-text',
          '.jobs-unified-top-card__job-title',
          '.job-details-jobs-unified-top-card__job-title-link',
          'h1.job-title',
          '[data-test-id="job-title"]',
          '.job-title'
        ];

        selectors.forEach((selector, index) => {
          document.querySelector.mockImplementation((sel) => {
            if (sel === selector) {
              return { textContent: 'Test Title' };
            }
            if (sel === '.job-details-jobs-unified-top-card__company-name') {
              return { textContent: 'Test Company' };
            }
            return null;
          });

          const result = jobDetector.extractLinkedInJob();
          expect(result.parsingMetadata.selectors.title.index).toBe(index);
        });
      });

      test('should handle empty or whitespace-only titles', () => {
        document.querySelector.mockImplementation((selector) => {
          if (selector.includes('job-title')) {
            return { textContent: '   ' };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result).toBeNull();
      });
    });

    describe('Company Extraction', () => {
      test('should extract company using primary selector', () => {
        document.querySelector.mockImplementation((selector) => {
          if (selector === '.job-details-jobs-unified-top-card__job-title') {
            return { textContent: 'Software Engineer' };
          }
          if (selector === '.job-details-jobs-unified-top-card__company-name') {
            return { textContent: 'Google Inc.' };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result.company).toBe('Google Inc.');
        expect(result.parsingMetadata.selectors.company.success).toBe(true);
      });

      test('should fallback through all company selectors', () => {
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

        companySelectors.forEach((selector, index) => {
          document.querySelector.mockImplementation((sel) => {
            if (sel === '.job-details-jobs-unified-top-card__job-title') {
              return { textContent: 'Test Title' };
            }
            if (sel === selector) {
              return { textContent: 'Test Company' };
            }
            return null;
          });

          const result = jobDetector.extractLinkedInJob();
          expect(result.parsingMetadata.selectors.company.index).toBe(index);
        });
      });
    });

    describe('Description Extraction', () => {
      test('should extract description with raw HTML storage', () => {
        document.querySelector.mockImplementation((selector) => {
          if (selector === '.job-details-jobs-unified-top-card__job-title') {
            return { textContent: 'Software Engineer' };
          }
          if (selector === '.job-details-jobs-unified-top-card__company-name') {
            return { textContent: 'Google' };
          }
          if (selector === '.jobs-description-content__text') {
            return { 
              textContent: 'Job description text',
              outerHTML: '<div class="jobs-description-content__text">Job description text</div>'
            };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result.description).toBe('Job description text');
        expect(result.rawJobDescriptionHtml).toBe('<div class="jobs-description-content__text">Job description text</div>');
      });

      test('should try all description selectors for raw HTML', () => {
        const descriptionSelectors = [
          '.jobs-description-content__text',
          '.jobs-box__html-content',
          '[data-test-id="job-description"]',
          '.job-description',
          '.jobs-description',
          '.description-content',
          '.job-details-jobs-unified-top-card__job-description'
        ];

        descriptionSelectors.forEach((selector) => {
          document.querySelector.mockImplementation((sel) => {
            if (sel === '.job-details-jobs-unified-top-card__job-title') {
              return { textContent: 'Software Engineer' };
            }
            if (sel === '.job-details-jobs-unified-top-card__company-name') {
              return { textContent: 'Google' };
            }
            if (sel === selector) {
              return { 
                textContent: 'Test description',
                outerHTML: `<div class="${selector}">Test description</div>`
              };
            }
            return null;
          });

          const result = jobDetector.extractLinkedInJob();
          expect(result.rawJobDescriptionHtml).toContain(selector);
        });
      });
    });

    describe('Location Extraction', () => {
      test('should extract location with fallback to "Not specified"', () => {
        document.querySelector.mockImplementation((selector) => {
          if (selector === '.job-details-jobs-unified-top-card__job-title') {
            return { textContent: 'Software Engineer' };
          }
          if (selector === '.job-details-jobs-unified-top-card__company-name') {
            return { textContent: 'Google' };
          }
          if (selector.includes('location')) {
            return { textContent: 'San Francisco, CA' };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result.location).toBe('San Francisco, CA');
      });

      test('should default to "Not specified" when no location found', () => {
        document.querySelector.mockImplementation((selector) => {
          if (selector === '.job-details-jobs-unified-top-card__job-title') {
            return { textContent: 'Software Engineer' };
          }
          if (selector === '.job-details-jobs-unified-top-card__company-name') {
            return { textContent: 'Google' };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result.location).toBe('Not specified');
      });
    });

    describe('Parsing Metadata', () => {
      test('should track LinkedIn version detection', () => {
        document.querySelector.mockImplementation((selector) => {
          if (selector === '.job-details-jobs-unified-top-card__job-title') {
            return { textContent: 'Software Engineer' };
          }
          if (selector === '.job-details-jobs-unified-top-card__company-name') {
            return { textContent: 'Google' };
          }
          if (selector === '.jobs-unified-top-card') {
            return { textContent: 'Test' };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result.parsingMetadata.linkedInVersion).toBe('unified-top-card');
      });

      test('should calculate extraction confidence correctly', () => {
        document.querySelector.mockImplementation((selector) => {
          if (selector.includes('job-title')) {
            return { textContent: 'Software Engineer' };
          }
          if (selector.includes('company-name')) {
            return { textContent: 'Google' };
          }
          if (selector.includes('location')) {
            return { textContent: 'San Francisco' };
          }
          if (selector.includes('description')) {
            return { 
              textContent: 'A comprehensive job description with enough content to meet the minimum length requirement for full confidence scoring',
              outerHTML: '<div>A comprehensive job description with enough content to meet the minimum length requirement for full confidence scoring</div>'
            };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result.parsingMetadata.confidence).toBe(100);
      });

      test('should track fallback usage', () => {
        document.querySelector.mockImplementation((selector) => {
          if (selector === 'h1[data-test-id="job-title"]') {
            return { textContent: 'Software Engineer' };
          }
          if (selector === 'a[data-test-id="job-company-name"]') {
            return { textContent: 'Google' };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result.parsingMetadata.fallbackUsed).toBe(true);
      });

      test('should include extraction timestamp', () => {
        const beforeExtraction = new Date();
        
        document.querySelector.mockImplementation((selector) => {
          if (selector.includes('job-title')) {
            return { textContent: 'Software Engineer' };
          }
          if (selector.includes('company-name')) {
            return { textContent: 'Google' };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        const afterExtraction = new Date();
        
        const extractionTime = new Date(result.parsingMetadata.extractedAt);
        expect(extractionTime.getTime()).toBeGreaterThanOrEqual(beforeExtraction.getTime());
        expect(extractionTime.getTime()).toBeLessThanOrEqual(afterExtraction.getTime());
      });
    });

    describe('Error Handling', () => {
      test('should return null when title is missing', () => {
        document.querySelector.mockImplementation((selector) => {
          if (selector.includes('company-name')) {
            return { textContent: 'Google' };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result).toBeNull();
      });

      test('should return null when company is missing', () => {
        document.querySelector.mockImplementation((selector) => {
          if (selector.includes('job-title')) {
            return { textContent: 'Software Engineer' };
          }
          return null;
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result).toBeNull();
      });

      test('should handle parsing errors gracefully', () => {
        document.querySelector.mockImplementation(() => {
          throw new Error('DOM access error');
        });

        const result = jobDetector.extractLinkedInJob();
        expect(result).toBeNull();
      });
    });
  });

  describe('Other Job Boards', () => {
    test('should extract Indeed jobs', () => {
      // Mock window.location properly
      delete global.window.location;
      global.window.location = { href: 'https://www.indeed.com/viewjob?jk=123456' };
      
      document.querySelector.mockImplementation((selector) => {
        if (selector === 'h1[data-testid="job-title"]') {
          return { textContent: 'Indeed Job Title' };
        }
        if (selector === '[data-testid="company-name"]') {
          return { textContent: 'Indeed Company' };
        }
        return null;
      });

      const result = jobDetector.extractJobData();
      expect(result.source).toBe('Indeed');
      expect(result.title).toBe('Indeed Job Title');
    });

    test('should extract Glassdoor jobs', () => {
      // Mock window.location properly
      delete global.window.location;
      global.window.location = { href: 'https://www.glassdoor.com/Job/job-details.htm?jobId=123456' };
      
      document.querySelector.mockImplementation((selector) => {
        if (selector === '[data-test="job-title"]') {
          return { textContent: 'Glassdoor Job Title' };
        }
        if (selector === '[data-test="employer-name"]') {
          return { textContent: 'Glassdoor Company' };
        }
        return null;
      });

      const result = jobDetector.extractJobData();
      expect(result.source).toBe('Glassdoor');
      expect(result.title).toBe('Glassdoor Job Title');
    });
  });

  describe('Helper Methods', () => {
    test('extractWithFallbacks should work correctly', () => {
      const metadata = { selectors: {}, fallbackUsed: false };
      const selectors = ['.primary', '.secondary', '.tertiary'];
      
      // Test primary selector success
      document.querySelector.mockImplementation((selector) => {
        if (selector === '.primary') {
          return { textContent: 'Primary Result' };
        }
        return null;
      });

      const result1 = jobDetector.extractWithFallbacks(selectors, 'test', metadata);
      expect(result1).toBe('Primary Result');
      expect(metadata.selectors.test.index).toBe(0);
      expect(metadata.fallbackUsed).toBe(false);

      // Test fallback selector success
      document.querySelector.mockImplementation((selector) => {
        if (selector === '.secondary') {
          return { textContent: 'Secondary Result' };
        }
        return null;
      });

      const result2 = jobDetector.extractWithFallbacks(selectors, 'test2', metadata);
      expect(result2).toBe('Secondary Result');
      expect(metadata.selectors.test2.index).toBe(1);
      expect(metadata.fallbackUsed).toBe(true);
    });

    test('calculateExtractionConfidence should work correctly', () => {
      const confidence1 = jobDetector.calculateExtractionConfidence('Title', 'Company', 'Location', 'This is a comprehensive job description with more than fifty characters in it');
      expect(confidence1).toBe(100);

      const confidence2 = jobDetector.calculateExtractionConfidence('Title', 'Company', null, null);
      expect(confidence2).toBe(60);

      const confidence3 = jobDetector.calculateExtractionConfidence(null, null, null, null);
      expect(confidence3).toBe(0);
    });

    test('detectLinkedInVersion should work correctly', () => {
      document.querySelector.mockImplementation((selector) => {
        if (selector === '.jobs-unified-top-card') {
          return { textContent: 'Test' };
        }
        return null;
      });

      const version = jobDetector.detectLinkedInVersion();
      expect(version).toBe('unified-top-card');
    });
  });
});
