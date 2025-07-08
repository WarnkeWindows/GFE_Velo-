/**
 * Master Page for Good Faith Exteriors Main Site
 * Global configurations and shared functionality
 */

import { session } from 'wix-storage-frontend';
import * as gfeService from 'backend/gfe-service.jsw';

$w.onReady(function () {
  console.log('GFE Main Site - Master Page Ready');
  
  // Initialize global configurations
  initializeGlobalConfig();
  
  // Set up global error handling
  setupErrorHandling();
  
  // Initialize analytics tracking
  initializeAnalytics();
});

/**
 * Initialize global configuration
 */
function initializeGlobalConfig() {
  // Set site-wide configurations
  const config = {
    apiBaseUrl: 'https://gfe-api-gateway-aonuaov3.uc.gateway.dev',
    siteId: '5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4',
    siteName: 'Good Faith Exteriors - Main Site',
    version: '2.0.0',
    gaTrackingId: 'G-XXXXXXXXXX' // <-- Add your Google Analytics Tracking ID here
  };
  
  // Store config in session
  session.setItem('gfe_config', JSON.stringify(config));
  
  console.log('Global config initialized:', config);
}

/**
 * Set up global error handling
 */
function setupErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Log error to backend if needed
    if (event.error && event.error.message) {
      logErrorToBackend(event.error);
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Log promise rejection to backend if needed
    logErrorToBackend(event.reason);
  });
}

/**
 * Initialize analytics tracking
 */
function initializeAnalytics() {
  // Track page views and user interactions
  try {
    if (typeof window.gtag === 'function') {
      const config = getGlobalConfig();
      const trackingId = config.gaTrackingId || 'G-XXXXXXXXXX'; // Fallback tracking ID
      window.gtag('config', trackingId, {
        page_title: document.title,
        page_location: window.location.href
      });
    } else {
      console.warn('GFE Analytics: gtag is not defined. Google Analytics script might be missing or blocked.');
    }
  } catch (e) {
    console.error('GFE Analytics: Error initializing gtag.', e);
  }
  
  // Custom GFE analytics
  trackSiteVisit();
}

/**
 * Log errors to backend
 */
async function logErrorToBackend(error) {
  try {
    // Only log in production
    const config = JSON.parse(session.getItem('gfe_config') || '{}');
    
    if (config.environment === 'production') {
      await gfeService.logError({
        message: error.message || String(error),
        stack: error.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    }
  } catch (logError) {
    console.error('Failed to log error to backend:', logError);
  }
}

/**
 * Track site visit
 */
async function trackSiteVisit() {
  try {
    const visitData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      site: 'main-production'
    };
    
    // Store visit in session storage
    session.setItem('current_visit', JSON.stringify(visitData));
    
    console.log('Site visit tracked:', visitData);
  } catch (error) {
    console.error('Failed to track site visit:', error);
  }
}

/**
 * Utility function to get current configuration
 */
export function getGlobalConfig() {
  try {
    return JSON.parse(session.getItem('gfe_config') || '{}');
  } catch (error) {
    console.error('Failed to get global config:', error);
    return {};
  }
}

/**
 * Utility function to check if backend is healthy
 */
export async function checkBackendStatus() {
  try {
    const health = await gfeService.checkBackendHealth();
    return health.status === 'healthy';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}