// CareerOS Job Collector - Clerk Authentication Service
// Handles authentication with Clerk for the Chrome extension

class ClerkAuthService {
  constructor() {
    this.isAuthenticated = false;
    this.user = null;
    this.token = null;
    this.clerkPublishableKey = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Get Clerk configuration from storage or use default
      const settings = await this.getSettings();
      this.clerkPublishableKey = settings.clerkPublishableKey || 'pk_test_your-clerk-publishable-key';
      
      // Check if user is already authenticated
      await this.checkAuthenticationStatus();
    } catch (error) {
      console.error('ClerkAuthService initialization error:', error);
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
      const result = await chrome.storage.local.get(['clerkAuth']);
      const authData = result.clerkAuth;
      
      if (authData && authData.token && authData.user) {
        // Check if token is still valid
        const isValid = await this.validateToken(authData.token);
        if (isValid) {
          this.isAuthenticated = true;
          this.user = authData.user;
          this.token = authData.token;
          console.log('User is authenticated:', this.user.email);
          return true;
        } else {
          // Token is invalid, clear auth data
          await this.clearAuthData();
        }
      }
      
      // If no stored auth data, try to get auth from CareerOS session
      const careerOSAuth = await this.checkCareerOSSession();
      if (careerOSAuth.authenticated) {
        this.isAuthenticated = true;
        this.user = careerOSAuth.user;
        this.token = careerOSAuth.token;
        
        // Store the auth data for future use
        await this.storeAuthData(careerOSAuth);
        console.log('User authenticated via CareerOS session:', this.user.email);
        return true;
      }
      
      this.isAuthenticated = false;
      this.user = null;
      this.token = null;
      return false;
    } catch (error) {
      console.error('Error checking authentication status:', error);
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
}

// Export for use in other parts of the extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClerkAuthService;
} else {
  window.ClerkAuthService = ClerkAuthService;
}
