// Enhanced Clerk Authentication Service Tests
// Tests for the improved authentication system with multiple strategies

// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    remove: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  },
  runtime: {
    getURL: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
};

// Mock fetch
global.fetch = jest.fn();

// Import the service after mocking
const ClerkAuthService = require('../src/auth/clerk-auth.js');

describe('Enhanced ClerkAuthService', () => {
  let authService;
  let mockSettings;
  let mockAuthData;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock settings
    mockSettings = {
      clerkPublishableKey: 'pk_test_mock_key',
      careerOSUrl: 'http://localhost:3000'
    };
    
    // Mock auth data
    mockAuthData = {
      user: {
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      },
      token: 'mock_token_123',
      session: {
        id: 'session_123',
        type: 'extension_session',
        createdAt: Date.now()
      },
      timestamp: Date.now()
    };

    // Mock chrome.storage.local.get
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const result = {};
      if (keys.includes('settings')) {
        result.settings = mockSettings;
      }
      if (keys.includes('clerkAuth')) {
        result.clerkAuth = mockAuthData;
      }
      callback(result);
    });

    // Mock chrome.storage.local.set
    chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });

    // Mock chrome.storage.local.remove
    chrome.storage.local.remove.mockImplementation((keys, callback) => {
      if (callback) callback();
    });

    // Mock chrome.runtime.getURL
    chrome.runtime.getURL.mockReturnValue('chrome-extension://mock-id/auth-callback.html');

    // Create new service instance
    authService = new ClerkAuthService();
  });

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(authService.extensionId).toBe('career-os-extension');
      expect(authService.extensionVersion).toBe('1.0.0');
      expect(authService.authStrategies).toEqual(['session_detection', 'extension_auth', 'fallback', 'cached']);
      expect(authService.maxRetries).toBe(3);
    });

    test('should load settings from storage', async () => {
      await authService.initialize();
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['settings'], expect.any(Function));
    });
  });

  describe('Stored Authentication Strategy', () => {
    test('should succeed with valid stored auth data', async () => {
      // Mock successful token validation
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, valid: true })
      });

      // Ensure the service has the mock auth data
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        const result = {};
        if (keys.includes('clerkAuth')) {
          result.clerkAuth = mockAuthData;
        }
        callback(result);
      });

      const result = await authService.checkStoredAuth();
      
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('stored');
      expect(authService.isAuthenticated).toBe(true);
      expect(authService.user).toEqual(mockAuthData.user);
    });

    test('should fail with no stored auth data', async () => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        const result = {};
        if (keys.includes('clerkAuth')) {
          result.clerkAuth = null;
        }
        callback(result);
      });

      const result = await authService.checkStoredAuth();
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('no_stored_data');
    });

    test('should fail with expired stored auth data', async () => {
      const expiredAuthData = {
        ...mockAuthData,
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      chrome.storage.local.get.mockImplementation((keys, callback) => {
        const result = {};
        if (keys.includes('clerkAuth')) {
          result.clerkAuth = expiredAuthData;
        }
        callback(result);
      });

      const result = await authService.checkStoredAuth();
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('stored_data_expired');
      expect(chrome.storage.local.remove).toHaveBeenCalled();
    });

    test('should fail with invalid stored token', async () => {
      // Mock failed token validation
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      // Ensure the service has the mock auth data
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        const result = {};
        if (keys.includes('clerkAuth')) {
          result.clerkAuth = mockAuthData;
        }
        callback(result);
      });

      const result = await authService.checkStoredAuth();
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('stored_token_invalid');
    });
  });

  describe('Extension Authentication Strategy', () => {
    test('should succeed with valid extension auth', async () => {
      const mockExtensionResponse = {
        success: true,
        authenticated: true,
        user: mockAuthData.user,
        token: mockAuthData.token,
        session: mockAuthData.session
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExtensionResponse)
      });

      const result = await authService.checkExtensionAuth();
      
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('extension_auth');
      expect(authService.isAuthenticated).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/extension',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Extension-ID': 'career-os-extension',
            'X-Extension-Version': '1.0.0'
          })
        })
      );
    });

    test('should fail with extension auth error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await authService.checkExtensionAuth();
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('extension_auth_error');
    });
  });

  describe('Fallback Authentication Strategy', () => {
    test('should succeed with fallback auth', async () => {
      const mockFallbackResponse = {
        success: true,
        user: mockAuthData.user,
        token: mockAuthData.token
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFallbackResponse)
      });

      const result = await authService.checkFallbackAuth();
      
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('fallback');
      expect(authService.isAuthenticated).toBe(true);
    });

    test('should fail with fallback auth error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const result = await authService.checkFallbackAuth();
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('fallback_auth_failed');
    });
  });

  describe('CareerOS Session Detection Strategy', () => {
    test('should succeed with session detection', async () => {
      const mockSessionResponse = {
        success: true,
        hasSession: true
      };

      const mockExtensionResponse = {
        success: true,
        authenticated: true,
        user: mockAuthData.user,
        token: mockAuthData.token,
        session: mockAuthData.session
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSessionResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockExtensionResponse)
        });

      const result = await authService.checkCareerOSSession();
      
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('session_detection');
      expect(authService.isAuthenticated).toBe(true);
    });

    test('should fallback to content script when session detection fails', async () => {
      // Mock failed session detection
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      // Mock successful content script detection
      chrome.tabs.query.mockResolvedValueOnce([
        { id: 1, url: 'http://localhost:3000/dashboard' }
      ]);

      chrome.scripting.executeScript.mockResolvedValueOnce([
        {
          result: {
            authenticated: true,
            user: {
              id: 'user_123',
              email: 'test@example.com'
            },
            token: 'mock_token_123'
          }
        }
      ]);

      const result = await authService.checkCareerOSSession();
      
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('content_script');
    });
  });

  describe('Error Handling', () => {
    test('should handle authentication errors with retry logic', () => {
      const mockError = new Error('Test error');
      
      // Mock setTimeout to test retry logic
      jest.useFakeTimers();
      
      authService.handleAuthError('TEST_ERROR', mockError);
      
      expect(authService.authRetryCount).toBe(1);
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          lastAuthError: expect.objectContaining({
            code: 'TEST_ERROR',
            retryCount: 1
          })
        }),
        expect.any(Function)
      );
      
      jest.useRealTimers();
    });

    test('should stop retrying after max retries', () => {
      authService.authRetryCount = 3;
      
      authService.handleAuthError('TEST_ERROR', new Error('Test error'));
      
      expect(authService.authRetryCount).toBe(0); // Should reset
    });
  });

  describe('Health Check and Diagnostics', () => {
    test('should perform health check successfully', async () => {
      const mockHealthResponse = {
        success: true,
        status: 'healthy',
        checks: {
          authentication: { status: 'healthy' },
          database: { status: 'healthy' },
          api: { status: 'healthy' }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse)
      });

      const result = await authService.performHealthCheck();
      
      expect(result.success).toBe(true);
      expect(result.status).toBe('healthy');
    });

    test('should perform diagnostic successfully', async () => {
      const mockDiagnosticResponse = {
        success: true,
        system: { environment: 'test' },
        authentication: { hasUserId: true },
        extension: { id: 'career-os-extension' }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDiagnosticResponse)
      });

      const result = await authService.performDiagnostic();
      
      expect(result.success).toBe(true);
      expect(result.system.environment).toBe('test');
    });
  });

  describe('Storage Management', () => {
    test('should store auth data with metadata', async () => {
      const authData = {
        user: mockAuthData.user,
        token: mockAuthData.token,
        session: mockAuthData.session
      };

      await authService.storeAuthData(authData);
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        {
          clerkAuth: expect.objectContaining({
            user: authData.user,
            token: authData.token,
            session: authData.session,
            timestamp: expect.any(Number),
            strategy: null, // Will be set by the calling method
            extensionId: 'career-os-extension',
            extensionVersion: '1.0.0'
          })
        },
        expect.any(Function)
      );
    });

    test('should clear auth data', async () => {
      await authService.clearAuthData();
      
      expect(authService.isAuthenticated).toBe(false);
      expect(authService.user).toBe(null);
      expect(authService.token).toBe(null);
      expect(chrome.storage.local.remove).toHaveBeenCalledWith(['clerkAuth'], expect.any(Function));
    });
  });

  describe('Authentication Status Check', () => {
    test('should try all strategies in order', async () => {
      // Mock all strategies to fail except the last one
      const mockFallbackResponse = {
        success: true,
        user: mockAuthData.user,
        token: mockAuthData.token
      };

      // Mock stored auth to fail
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ clerkAuth: null });
      });

      // Mock session detection to fail
      fetch
        .mockResolvedValueOnce({ ok: false, status: 401 }) // session detection
        .mockResolvedValueOnce({ ok: false, status: 401 }) // extension auth
        .mockResolvedValueOnce({ // fallback auth succeeds
          ok: true,
          json: () => Promise.resolve(mockFallbackResponse)
        });

      const result = await authService.checkAuthenticationStatus();
      
      expect(result).toBe(true);
      expect(authService.currentStrategy).toBe('fallback');
    });

    test('should return false when all strategies fail', async () => {
      // Mock all strategies to fail
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ clerkAuth: null });
      });

      fetch.mockResolvedValue({ ok: false, status: 401 });

      const result = await authService.checkAuthenticationStatus();
      
      expect(result).toBe(false);
      expect(authService.isAuthenticated).toBe(false);
    });
  });
});
