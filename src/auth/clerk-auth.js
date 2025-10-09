// CareerOS Job Collector - Enhanced Clerk Authentication Service
// Handles authentication with Clerk for the Chrome extension with fallback strategies

class ClerkAuthService {
  constructor() {
    this.isAuthenticated = false;
    this.user = null;
    this.token = null;
    this.session = null;
    this.clerkPublishableKey = null;
    this.careerOSUrl = null;
    this.extensionId = 'career-os-extension';
    this.extensionVersion = '1.0.0';
    this.authStrategies = ['session_detection', 'extension_auth', 'fallback', 'cached'];
    this.currentStrategy = null;
    this.lastAuthCheck = null;
    this.authRetryCount = 0;
    this.maxRetries = 3;
    this.initialize();
  }

  async initialize() {
    try {
      // Get configuration from storage
      const settings = await this.getSettings();
      this.clerkPublishableKey = settings.clerkPublishableKey || 'pk_test_your-clerk-publishable-key';
      this.careerOSUrl = settings.careerOSUrl || 'http://localhost:3000';
      
      console.log('🔧 ClerkAuthService initializing...');
      console.log('📡 CareerOS URL:', this.careerOSUrl);
      console.log('🔑 Clerk Key configured:', !!this.clerkPublishableKey);
      
      // Check if user is already authenticated with enhanced strategies
      await this.checkAuthenticationStatus();
      
      console.log('✅ ClerkAuthService initialized');
    } catch (error) {
      console.error('❌ ClerkAuthService initialization error:', error);
      this.handleAuthError('INITIALIZATION_ERROR', error);
    }
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        resolve(result.settings || {});
      });
    });
  }

  async checkAuthenticationStatus() {
    try {
      console.log('🔍 Checking authentication status with enhanced strategies...');
      this.lastAuthCheck = Date.now();
      
      // Strategy 1: Check stored authentication data
      const storedAuth = await this.checkStoredAuth();
      if (storedAuth.success) {
        this.currentStrategy = 'stored';
        return storedAuth.success;
      }
      
      // Strategy 2: Check CareerOS session detection
      const sessionAuth = await this.checkCareerOSSession();
      if (sessionAuth.success) {
        this.currentStrategy = 'session_detection';
        return sessionAuth.success;
      }
      
      // Strategy 3: Try extension-specific authentication
      const extensionAuth = await this.checkExtensionAuth();
      if (extensionAuth.success) {
        this.currentStrategy = 'extension_auth';
        return extensionAuth.success;
      }
      
      // Strategy 4: Try fallback authentication
      const fallbackAuth = await this.checkFallbackAuth();
      if (fallbackAuth.success) {
        this.currentStrategy = 'fallback';
        return fallbackAuth.success;
      }
      
      // All strategies failed
      this.isAuthenticated = false;
      this.user = null;
      this.token = null;
      this.session = null;
      this.currentStrategy = null;
      
      console.log('❌ All authentication strategies failed');
      return false;
      
    } catch (error) {
      console.error('❌ Error checking authentication status:', error);
      this.handleAuthError('AUTH_CHECK_ERROR', error);
      return false;
    }
  }

  async validateToken(token) {
    try {
      // Make a request to CareerOS to validate the token
      const settings = await this.getSettings();
      const response = await fetch(`${settings.careerOSUrl}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  async checkCareerOSSession() {
    try {
      const settings = await this.getSettings();
      const careerOSUrl = settings.careerOSUrl || 'http://localhost:3000';
      
      console.log('Checking CareerOS session at:', careerOSUrl);
      
      // First, try to check authentication via content script injection
      const contentScriptAuth = await this.checkCareerOSAuthViaContentScript(careerOSUrl);
      if (contentScriptAuth.authenticated) {
        console.log('Authentication detected via content script:', contentScriptAuth);
        return contentScriptAuth;
      }
      
      // Fallback: Try to get current user info from CareerOS
      const response = await fetch(`${careerOSUrl}/api/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include cookies to check session
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('CareerOS session check response:', response.status, response.statusText);

      if (response.ok) {
        const userData = await response.json();
        console.log('CareerOS session found:', userData);
        
        // Get a fresh token for the extension
        const tokenResponse = await fetch(`${careerOSUrl}/api/auth/token`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        console.log('Token response:', tokenResponse.status, tokenResponse.statusText);

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          console.log('Token obtained successfully');
          return {
            authenticated: true,
            user: userData.user,
            token: tokenData.token
          };
        } else {
          console.log('Failed to get token:', tokenResponse.status);
        }
      } else {
        console.log('No CareerOS session found:', response.status);
      }
      
      return { authenticated: false };
    } catch (error) {
      console.error('CareerOS session check error:', error);
      return { authenticated: false };
    }
  }

  async checkCareerOSAuthViaContentScript(careerOSUrl) {
    try {
      console.log('Checking authentication via content script injection...');
      
      // Get all tabs
      const tabs = await chrome.tabs.query({});
      
      // Find CareerOS tab
      const careerOSTab = tabs.find(tab => 
        tab.url && (tab.url.includes('localhost:3000') || tab.url.includes('career-os'))
      );
      
      if (!careerOSTab) {
        console.log('No CareerOS tab found');
        return { authenticated: false };
      }
      
      console.log('Found CareerOS tab:', careerOSTab.id, careerOSTab.url);
      
      // Inject content script to check authentication
      const results = await chrome.scripting.executeScript({
        target: { tabId: careerOSTab.id },
        func: () => {
          // Check if user is authenticated by looking for Clerk elements
          const clerkElements = document.querySelectorAll('[data-clerk-user]');
          const userButton = document.querySelector('[data-testid="user-button"]');
          const signOutButton = document.querySelector('[data-testid="sign-out-button"]');
          const clerkUserButton = document.querySelector('.clerk-userButton');
          const clerkUserMenu = document.querySelector('.clerk-userMenu');
          
          // Check for authentication indicators
          const isAuthenticated = clerkElements.length > 0 || 
                                 userButton || 
                                 signOutButton ||
                                 clerkUserButton ||
                                 clerkUserMenu ||
                                 document.querySelector('[data-clerk-user]');
          
          // Try to get user info from Clerk if available
          let userInfo = null;
          if (window.Clerk && window.Clerk.user) {
            userInfo = {
              id: window.Clerk.user.id,
              email: window.Clerk.user.primaryEmailAddress?.emailAddress,
              firstName: window.Clerk.user.firstName,
              lastName: window.Clerk.user.lastName
            };
          }
          
          return {
            authenticated: isAuthenticated,
            user: userInfo,
            url: window.location.href,
            clerkElements: clerkElements.length,
            hasUserButton: !!userButton,
            hasSignOutButton: !!signOutButton,
            hasClerkUserButton: !!clerkUserButton,
            hasClerkUserMenu: !!clerkUserMenu
          };
        }
      });
      
      if (results && results[0] && results[0].result) {
        const authResult = results[0].result;
        console.log('Content script auth check result:', authResult);
        
        if (authResult.authenticated) {
          // Try to get a token by making a request from the CareerOS tab context
          try {
            const tokenResult = await chrome.scripting.executeScript({
              target: { tabId: careerOSTab.id },
              func: async () => {
                try {
                  const response = await fetch('/api/auth/token', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    return data.token;
                  }
                  return null;
                } catch (error) {
                  console.error('Error getting token:', error);
                  return null;
                }
              }
            });
            
            if (tokenResult && tokenResult[0] && tokenResult[0].result) {
              authResult.token = tokenResult[0].result;
            }
          } catch (tokenError) {
            console.error('Error getting token via content script:', tokenError);
          }
          
          return authResult;
        }
      }
      
      return { authenticated: false };
    } catch (error) {
      console.error('Error checking auth via content script:', error);
      return { authenticated: false };
    }
  }

  async authenticate() {
    try {
      console.log('Starting Clerk authentication...');
      
      // Open Clerk authentication in a new tab
      const authUrl = await this.getAuthUrl();
      const tab = await this.openAuthTab(authUrl);
      
      // Wait for authentication to complete
      const authResult = await this.waitForAuthentication(tab.id);
      
      if (authResult.success) {
        this.isAuthenticated = true;
        this.user = authResult.user;
        this.token = authResult.token;
        
        // Store auth data
        await this.storeAuthData(authResult);
        
        console.log('Authentication successful:', this.user.email);
        return { success: true, user: this.user };
      } else {
        throw new Error(authResult.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  async getAuthUrl() {
    const settings = await this.getSettings();
    const baseUrl = settings.careerOSUrl || 'http://localhost:3000';
    
    // Create a special auth page URL that will handle the extension callback
    const authUrl = `${baseUrl}/auth/extension?redirect=${encodeURIComponent(chrome.runtime.getURL('auth-callback.html'))}`;
    return authUrl;
  }

  async openAuthTab(url) {
    return new Promise((resolve) => {
      chrome.tabs.create({ url }, (tab) => {
        resolve(tab);
      });
    });
  }

  async waitForAuthentication(tabId) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Authentication timeout' });
      }, 300000); // 5 minutes timeout

      // Listen for messages from the auth callback
      const messageListener = (message, sender, sendResponse) => {
        if (message.type === 'CLERK_AUTH_SUCCESS' && sender.tab?.id === tabId) {
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(messageListener);
          chrome.tabs.remove(tabId);
          resolve({ success: true, user: message.user, token: message.token });
        } else if (message.type === 'CLERK_AUTH_ERROR' && sender.tab?.id === tabId) {
          clearTimeout(timeout);
          chrome.runtime.onMessage.removeListener(messageListener);
          chrome.tabs.remove(tabId);
          resolve({ success: false, error: message.error });
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);
    });
  }

  async storeAuthData(authData) {
    const authDataToStore = {
      user: authData.user,
      token: authData.token,
      timestamp: Date.now()
    };
    
    return new Promise((resolve) => {
      chrome.storage.local.set({ clerkAuth: authDataToStore }, () => {
        resolve();
      });
    });
  }

  async clearAuthData() {
    this.isAuthenticated = false;
    this.user = null;
    this.token = null;
    
    return new Promise((resolve) => {
      chrome.storage.local.remove(['clerkAuth'], () => {
        resolve();
      });
    });
  }

  async signOut() {
    try {
      await this.clearAuthData();
      console.log('User signed out');
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  getAuthHeaders() {
    if (!this.token) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async getCurrentUser() {
    if (this.isAuthenticated && this.user) {
      return this.user;
    }
    
    // Try to refresh from storage
    await this.checkAuthenticationStatus();
    return this.user;
  }

  isUserAuthenticated() {
    return this.isAuthenticated && this.user && this.token;
  }

  // Enhanced authentication strategies
  
  async checkStoredAuth() {
    try {
      console.log('🔍 Strategy 1: Checking stored authentication data...');
      
      const result = await chrome.storage.local.get(['clerkAuth']);
      const authData = result.clerkAuth;
      
      if (!authData || !authData.token || !authData.user) {
        console.log('❌ No stored auth data found');
        return { success: false, reason: 'no_stored_data' };
      }
      
      // Check if stored data is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - authData.timestamp > maxAge) {
        console.log('❌ Stored auth data is too old');
        await this.clearAuthData();
        return { success: false, reason: 'stored_data_expired' };
      }
      
      // Validate the stored token
      const isValid = await this.validateToken(authData.token);
      if (isValid) {
        this.isAuthenticated = true;
        this.user = authData.user;
        this.token = authData.token;
        this.session = authData.session;
        
        console.log('✅ Stored authentication is valid:', this.user.email);
        return { success: true, strategy: 'stored' };
      } else {
        console.log('❌ Stored token is invalid');
        await this.clearAuthData();
        return { success: false, reason: 'stored_token_invalid' };
      }
    } catch (error) {
      console.error('❌ Error checking stored auth:', error);
      return { success: false, reason: 'stored_auth_error', error };
    }
  }

  async checkExtensionAuth() {
    try {
      console.log('🔍 Strategy 3: Checking extension-specific authentication...');
      
      const response = await fetch(`${this.careerOSUrl}/api/auth/extension`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Extension-ID': this.extensionId,
          'X-Extension-Version': this.extensionVersion
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.authenticated) {
          this.isAuthenticated = true;
          this.user = data.user;
          this.token = data.token;
          this.session = data.session;
          
          // Store the auth data
          await this.storeAuthData({
            user: data.user,
            token: data.token,
            session: data.session
          });
          
          console.log('✅ Extension authentication successful:', this.user.email);
          return { success: true, strategy: 'extension_auth' };
        }
      }
      
      console.log('❌ Extension authentication failed:', response.status);
      return { success: false, reason: 'extension_auth_failed', status: response.status };
    } catch (error) {
      console.error('❌ Error in extension authentication:', error);
      return { success: false, reason: 'extension_auth_error', error };
    }
  }

  async checkFallbackAuth() {
    try {
      console.log('🔍 Strategy 4: Checking fallback authentication...');
      
      const response = await fetch(`${this.careerOSUrl}/api/auth/fallback`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Extension-ID': this.extensionId,
          'X-Extension-Version': this.extensionVersion
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.user && data.token) {
          this.isAuthenticated = true;
          this.user = data.user;
          this.token = data.token;
          this.session = data.session || {
            id: `fallback_session_${data.user.id}`,
            type: 'fallback',
            createdAt: Date.now()
          };
          
          // Store the auth data
          await this.storeAuthData({
            user: data.user,
            token: data.token,
            session: this.session
          });
          
          console.log('✅ Fallback authentication successful:', this.user.email);
          return { success: true, strategy: 'fallback' };
        }
      }
      
      console.log('❌ Fallback authentication failed:', response.status);
      return { success: false, reason: 'fallback_auth_failed', status: response.status };
    } catch (error) {
      console.error('❌ Error in fallback authentication:', error);
      return { success: false, reason: 'fallback_auth_error', error };
    }
  }

  async checkCareerOSSession() {
    try {
      console.log('🔍 Strategy 2: Checking CareerOS session detection...');
      
      // First try the new session detection endpoint
      const sessionResponse = await fetch(`${this.careerOSUrl}/api/auth/session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Extension-ID': this.extensionId,
          'X-Extension-Version': this.extensionVersion
        },
        body: JSON.stringify({
          extensionId: this.extensionId,
          extensionVersion: this.extensionVersion,
          requestedPermissions: [
            'extension:read',
            'extension:write',
            'jobs:bookmark',
            'jobs:sync',
            'resume:analyze',
            'user:profile'
          ]
        })
      });

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        
        if (sessionData.success && sessionData.hasSession) {
          // Get extension token
          const tokenResponse = await fetch(`${this.careerOSUrl}/api/auth/extension`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            
            if (tokenData.success && tokenData.authenticated) {
              this.isAuthenticated = true;
              this.user = tokenData.user;
              this.token = tokenData.token;
              this.session = tokenData.session;
              
              // Store the auth data
              await this.storeAuthData({
                user: tokenData.user,
                token: tokenData.token,
                session: tokenData.session
              });
              
              console.log('✅ CareerOS session detection successful:', this.user.email);
              return { success: true, strategy: 'session_detection' };
            }
          }
        }
      }
      
      // Fallback to original content script method
      console.log('🔄 Trying content script session detection...');
      const contentScriptAuth = await this.checkCareerOSAuthViaContentScript(this.careerOSUrl);
      if (contentScriptAuth.authenticated) {
        this.isAuthenticated = true;
        this.user = contentScriptAuth.user;
        this.token = contentScriptAuth.token;
        this.session = {
          id: `content_script_session_${contentScriptAuth.user?.id}`,
          type: 'content_script',
          createdAt: Date.now()
        };
        
        // Store the auth data
        await this.storeAuthData({
          user: contentScriptAuth.user,
          token: contentScriptAuth.token,
          session: this.session
        });
        
        console.log('✅ Content script session detection successful:', this.user.email);
        return { success: true, strategy: 'content_script' };
      }
      
      console.log('❌ CareerOS session detection failed');
      return { success: false, reason: 'session_detection_failed' };
    } catch (error) {
      console.error('❌ Error in CareerOS session detection:', error);
      return { success: false, reason: 'session_detection_error', error };
    }
  }

  // Enhanced error handling
  handleAuthError(errorCode, error) {
    console.error(`🚨 Authentication Error [${errorCode}]:`, error);
    
    // Increment retry count
    this.authRetryCount++;
    
    // Store error for debugging
    chrome.storage.local.set({
      lastAuthError: {
        code: errorCode,
        message: error.message || error,
        timestamp: Date.now(),
        retryCount: this.authRetryCount,
        strategy: this.currentStrategy
      }
    });
    
    // Auto-retry if under max retries
    if (this.authRetryCount < this.maxRetries) {
      console.log(`🔄 Auto-retrying authentication (${this.authRetryCount}/${this.maxRetries})...`);
      setTimeout(() => {
        this.checkAuthenticationStatus();
      }, 2000 * this.authRetryCount); // Exponential backoff
    } else {
      console.log('❌ Max authentication retries reached');
      this.authRetryCount = 0; // Reset for next manual attempt
    }
  }

  // Enhanced storage methods
  async storeAuthData(authData) {
    const authDataToStore = {
      user: authData.user,
      token: authData.token,
      session: authData.session,
      timestamp: Date.now(),
      strategy: this.currentStrategy,
      extensionId: this.extensionId,
      extensionVersion: this.extensionVersion
    };
    
    return new Promise((resolve) => {
      chrome.storage.local.set({ clerkAuth: authDataToStore }, () => {
        console.log('💾 Authentication data stored successfully');
        resolve();
      });
    });
  }

  // Health check method
  async performHealthCheck() {
    try {
      console.log('🏥 Performing authentication health check...');
      
      const response = await fetch(`${this.careerOSUrl}/api/auth/extension/health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Extension-ID': this.extensionId,
          'X-Extension-Version': this.extensionVersion
        }
      });

      if (response.ok) {
        const healthData = await response.json();
        console.log('✅ Health check successful:', healthData);
        return healthData;
      } else {
        console.log('❌ Health check failed:', response.status);
        return { success: false, status: response.status };
      }
    } catch (error) {
      console.error('❌ Health check error:', error);
      return { success: false, error: error.message };
    }
  }

  // Diagnostic method
  async performDiagnostic() {
    try {
      console.log('🔧 Performing authentication diagnostic...');
      
      const response = await fetch(`${this.careerOSUrl}/api/auth/extension/health`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Extension-ID': this.extensionId,
          'X-Extension-Version': this.extensionVersion
        },
        body: JSON.stringify({
          extensionId: this.extensionId,
          extensionVersion: this.extensionVersion,
          diagnosticLevel: 'advanced',
          includeUserInfo: true
        })
      });

      if (response.ok) {
        const diagnosticData = await response.json();
        console.log('✅ Diagnostic successful:', diagnosticData);
        return diagnosticData;
      } else {
        console.log('❌ Diagnostic failed:', response.status);
        return { success: false, status: response.status };
      }
    } catch (error) {
      console.error('❌ Diagnostic error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export for use in other parts of the extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClerkAuthService;
} else {
  window.ClerkAuthService = ClerkAuthService;
}
