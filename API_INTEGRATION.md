# CareerOS Job Collector - API Integration Guide

## Overview

The browser extension integrates with CareerOS through secure, authenticated API endpoints. This document outlines the API structure, authentication, and data flow.

## API Endpoints

### 1. Health Check
**Endpoint**: `GET /api/health`  
**Purpose**: Verify CareerOS connectivity  
**Authentication**: None required  

```javascript
// Extension usage
const response = await fetch(`${careerOSUrl}/api/health`);
const health = await response.json();
```

### 2. Job Bookmarking
**Endpoint**: `POST /api/jobs/bookmark`  
**Purpose**: Save a single job from extension  
**Authentication**: Required (Clerk)  

```javascript
// Extension usage
const response = await fetch(`${careerOSUrl}/api/jobs/bookmark`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Software Engineer',
    company: 'Tech Corp',
    description: 'Job description...',
    requirements: ['JavaScript', 'React'],
    location: 'San Francisco',
    salary: '$120k',
    url: 'https://example.com/job',
    source: 'LinkedIn',
    skills: ['JavaScript', 'React'],
    remote: false,
    userNotes: 'Interesting role',
    rating: 5
  })
});
```

### 3. Job Synchronization
**Endpoint**: `POST /api/jobs/sync`  
**Purpose**: Sync multiple jobs from extension  
**Authentication**: Required (Clerk)  

```javascript
// Extension usage
const response = await fetch(`${careerOSUrl}/api/jobs/sync`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobs: [
      { title: 'Job 1', company: 'Company 1', ... },
      { title: 'Job 2', company: 'Company 2', ... }
    ]
  })
});
```

### 4. Get User Jobs
**Endpoint**: `GET /api/jobs/bookmark`  
**Purpose**: Retrieve user's bookmarked jobs  
**Authentication**: Required (Clerk)  

```javascript
// Extension usage
const response = await fetch(`${careerOSUrl}/api/jobs/bookmark`);
const { jobs } = await response.json();
```

## Data Structure

### Job Bookmark Object
```typescript
interface JobBookmark {
  // Required fields
  title: string;
  company: string;
  description: string;
  
  // Optional fields
  requirements?: string[];
  location?: string;
  salary?: string;
  url?: string;
  source?: string;
  skills?: string[];
  remote?: boolean;
  deadline?: string;
  userNotes?: string;
  rating?: number;
}
```

### API Response Format
```typescript
interface APIResponse {
  success: boolean;
  jobId?: string;
  jobs?: JobBookmark[];
  synced?: number;
  duplicates?: number;
  total?: number;
  error?: string;
}
```

## Authentication

### Clerk Integration
The CareerOS app uses Clerk for authentication. The browser extension needs to handle authentication through the web app.

### Authentication Flow
1. **User visits CareerOS** and signs in
2. **Extension detects** CareerOS session
3. **API calls** are made with session cookies
4. **CareerOS validates** user session

### Implementation
```javascript
// Check if user is authenticated
async function isUserAuthenticated() {
  try {
    const response = await fetch(`${careerOSUrl}/api/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Make authenticated API call
async function makeAuthenticatedCall(endpoint, data) {
  const response = await fetch(`${careerOSUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies for authentication
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }
  
  return response.json();
}
```

## Error Handling

### Common Error Responses
```typescript
// 401 Unauthorized
{ error: 'Unauthorized' }

// 400 Bad Request
{ error: 'Title, company, and description are required' }

// 404 Not Found
{ error: 'User not found' }

// 500 Internal Server Error
{ error: 'Internal server error' }
```

### Extension Error Handling
```javascript
async function syncWithCareerOS() {
  try {
    const response = await fetch(`${careerOSUrl}/api/jobs/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ jobs })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('Sync successful:', result);
    
  } catch (error) {
    console.error('Sync failed:', error);
    
    // Handle specific error types
    if (error.message.includes('Unauthorized')) {
      // Redirect to CareerOS login
      chrome.tabs.create({ url: `${careerOSUrl}/sign-in` });
    } else {
      // Show error to user
      this.showError('Failed to sync with CareerOS');
    }
  }
}
```

## Security Considerations

### CORS Configuration
The CareerOS app needs to allow requests from the browser extension:

```javascript
// In CareerOS Next.js app
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ]
  },
}
```

### Data Validation
All API endpoints validate input data:

```typescript
// Required field validation
if (!title || !company || !description) {
  return NextResponse.json(
    { error: 'Title, company, and description are required' },
    { status: 400 }
  );
}

// Data sanitization
const sanitizedData = {
  title: title.trim(),
  company: company.trim(),
  description: description.trim(),
  // ... other fields
};
```

## Testing

### Local Development
1. **Start CareerOS**: `npm run dev` (localhost:3000)
2. **Load extension** in Chrome
3. **Test API calls** from extension
4. **Check browser console** for errors

### API Testing
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test job bookmark (requires authentication)
curl -X POST http://localhost:3000/api/jobs/bookmark \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Job","company":"Test Company","description":"Test Description"}'
```

## Deployment

### Production Configuration
- **CareerOS URL**: `https://career-os.vercel.app`
- **CORS**: Configured for production domain
- **Authentication**: Clerk production keys
- **Database**: Convex production instance

### Extension Configuration
```javascript
// Production settings
const settings = {
  careerOSUrl: 'https://career-os.vercel.app',
  syncWithCareerOS: true,
  autoAnalyze: true
};
```

## Monitoring

### API Usage Tracking
```typescript
// Track API usage
const apiUsage = {
  endpoint: '/api/jobs/bookmark',
  method: 'POST',
  timestamp: new Date().toISOString(),
  userId: userId,
  success: true
};
```

### Error Monitoring
```javascript
// Log API errors
console.error('API Error:', {
  endpoint: '/api/jobs/sync',
  error: error.message,
  timestamp: new Date().toISOString(),
  userId: userId
});
```

## Future Enhancements

### Planned API Endpoints
- **Job Analysis**: `POST /api/jobs/analyze`
- **Resume Optimization**: `POST /api/jobs/optimize-resume`
- **Career Insights**: `GET /api/insights/career`
- **Skill Recommendations**: `GET /api/insights/skills`

### Advanced Features
- **Real-time sync** with WebSocket
- **Batch operations** for multiple jobs
- **Offline support** with sync queue
- **Conflict resolution** for concurrent edits

---

**The API integration provides secure, authenticated communication between the browser extension and CareerOS!** 🚀
