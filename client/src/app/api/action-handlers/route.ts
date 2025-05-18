import { NextResponse } from 'next/server';

/**
 * API endpoint to retrieve action handler configurations from the backend
 */
export async function GET() {
  try {
    // Fetch action handlers from the backend API
    const response = await fetch('http://localhost:3001/api/table/action-handlers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store', // Disable caching to ensure fresh data
      next: { revalidate: 300 } // Revalidate cache every 5 minutes (300 seconds)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      return NextResponse.json({ 
        error: 'Backend service error', 
        details: {
          status: response.status,
          statusText: response.statusText,
          message: errorText
        }
      }, { 
        status: response.status,
        headers: {
          'Cache-Control': 'no-cache, max-age=0'
        }
      });
    }
    
    // Get the handler data from the backend
    const handlers = await response.json();
    
    // Return the handlers to the frontend
    return NextResponse.json(handlers, {
      headers: {
        'Cache-Control': 'private, max-age=300'
      }
    });
  } catch (error) {
    console.error('Error fetching action handlers:', error);
    
    // If the backend is unavailable, fall back to local handler definitions
    // This ensures the application works even if the backend is down
    const fallbackHandlers = [
      {
        type: 'save',
        config: {
          enabled: true,
          permissions: ['basic:write'],
          settings: {
            confirmBeforeSave: true,
            notifyOnSave: true,
          },
          endpoints: {
            base: '/api',
          }
        }
      },
      {
        type: 'delete',
        config: {
          enabled: true,
          permissions: ['admin:delete'],
          settings: {
            confirmBeforeDelete: true,
            softDelete: false,
          },
          endpoints: {
            base: '/api',
          }
        }
      },
      {
        type: 'view',
        config: {
          enabled: true,
          permissions: ['basic:read'],
          settings: {
            openInModal: true,
          },
          endpoints: {
            base: '/api',
          }
        }
      }
    ];
    
    return NextResponse.json(fallbackHandlers, {
      headers: {
        'Cache-Control': 'private, max-age=60' // Shorter cache time for fallback data
      }
    });
  }
} 