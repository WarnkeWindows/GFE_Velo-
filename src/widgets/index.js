/**
 * Good Faith Exteriors - Widget Index
 * Main export file for all GFE widgets and components
 * 
 * This file centralizes all widget exports for easy integration
 * with the Wix Velo platform and external systems
 */

// Import React and ReactDOM
import React from 'react';
import ReactDOM from 'react-dom';

// Import all widget components
import WindowEstimator from './WindowEstimator/WindowEstimator';
import ProductBrowser from './ProductBrowser/ProductBrowser';
import TrainingComponents from './TrainingComponents/TrainingComponents';
import NotebookLMCommandCenter from './NotebookLMCommandCenter';

// Import shared components
import ErrorBoundary from './shared/ErrorBoundary';
import Loading from './shared/Loading';
import Error from './shared/Error';

// Import shared hooks
import { useWindowData, usePriceCalculation } from './shared/hooks/useWindowData';

// Import shared services
import { windowService } from './shared/services/window-service';
import { analyticsService } from './shared/services/analytics-service';
import { apiService } from './shared/services/api-service';

// Import shared utilities
import { api } from './shared/utils/api';

// Import styles
import './styles.css';
import './NotebookLMCommandCenter.css';

// Configuration for all widgets
export const WIDGET_CONFIG = {
  // Core API Configuration
  API: {
    WIX_SITE_ID: '5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4',
    BACKEND_URL: 'https://gfe-backend-837326026335.us-central1.run.app',
    API_GATEWAY: 'https://gfe-api-gateway-aonuaov3.uc.gateway.dev',
    HEADLESS_CLIENT_ID: 'b32df066-e276-4d06-b9ee-18187d7b1439',
    GOOGLE_CLIENT_ID: '837326026335-og5oga2u90sm079ht8450s5j4v4kmio0.apps.googleusercontent.com'
  },

  // Widget Features
  FEATURES: {
    AI_ESTIMATION: true,
    VISION_ANALYSIS: true,
    SMART_RECOMMENDATIONS: true,
    ERROR_TRACKING: true,
    ANALYTICS: true,
    DUAL_OAUTH: true,
    COMMAND_CENTER: true,
    NOTEBOOK_LM: true
  },

  // Collections (with GFE_ prefix)
  COLLECTIONS: {
    WINDOW_PRODUCTS: 'GFE_WindowProducts',
    QUOTES: 'GFE_Quotes',
    CUSTOMERS: 'GFE_Customers',
    LEADS: 'GFE_Leads',
    USER_SESSIONS: 'GFE_UserSessions',
    ANALYTICS: 'GFE_Analytics',
    DOCUMENTS: 'GFE_Documents',
    KNOWLEDGE_BASE: 'GFE_KnowledgeBase',
    API_LIBRARY: 'GFE_ApiLibrary',
    COMMAND_LOG: 'GFE_CommandLog'
  },

  // Theming
  THEME: {
    PRIMARY_NAVY: '#1A365D',
    PRIMARY_GOLD: '#D4AF37',
    ACCENT_SILVER: '#C0C0C0',
    SUCCESS_GREEN: '#38A169',
    ERROR_RED: '#E53E3E',
    WARNING_ORANGE: '#ED8936',
    INFO_BLUE: '#3182CE'
  },

  // Widget Specific Settings
  WIDGETS: {
    WINDOW_ESTIMATOR: {
      enabled: true,
      aiEnabled: true,
      visionEnabled: true,
      smartRecommendations: true,
      maxDimensions: { width: 240, height: 120 },
      supportedTypes: ['Casement', 'Double Hung', 'Sliding', 'Picture', 'Bay', 'Bow'],
      supportedBrands: ['Provia', 'Andersen', 'Pella', 'Marvin', 'Milgard']
    },
    PRODUCT_BROWSER: {
      enabled: true,
      aiEnabled: true,
      wishlistEnabled: true,
      filtersEnabled: true,
      sortingEnabled: true,
      maxProducts: 100,
      batchSize: 20
    },
    TRAINING_COMPONENTS: {
      enabled: true,
      modulesEnabled: true,
      assessmentsEnabled: true,
      certificationsEnabled: true,
      trackingEnabled: true
    },
    NOTEBOOK_COMMAND_CENTER: {
      enabled: true,
      adminMode: true,
      aiEnabled: true,
      documentUpload: true,
      terminalEnabled: true,
      apiLibrary: true,
      maxDocuments: 100,
      maxDocumentSize: 25 * 1024 * 1024 // 25MB
    }
  }
};

// Main widget registry
export const WIDGET_REGISTRY = {
  'window-estimator': WindowEstimator,
  'product-browser': ProductBrowser,
  'training-components': TrainingComponents,
  'notebook-command-center': NotebookLMCommandCenter
};

// Widget factory function
export const createWidget = (widgetType, props = {}) => {
  const Widget = WIDGET_REGISTRY[widgetType];
  
  if (!Widget) {
    throw new Error(`Widget type "${widgetType}" not found in registry`);
  }

  // Merge widget-specific config with props
  const widgetConfig = WIDGET_CONFIG.WIDGETS[widgetType.toUpperCase().replace('-', '_')];
  const mergedProps = {
    ...widgetConfig,
    ...props,
    config: WIDGET_CONFIG
  };

  return Widget(mergedProps);
};

// Widget validation function
export const validateWidget = (widgetType) => {
  const widget = WIDGET_REGISTRY[widgetType];
  const config = WIDGET_CONFIG.WIDGETS[widgetType.toUpperCase().replace('-', '_')];
  
  return {
    exists: !!widget,
    enabled: config?.enabled || false,
    features: config || {},
    requirements: getWidgetRequirements(widgetType)
  };
};

// Get widget requirements
export const getWidgetRequirements = (widgetType) => {
  const requirements = {
    'window-estimator': {
      collections: ['GFE_WindowProducts', 'GFE_Quotes', 'GFE_Customers'],
      apis: ['backend', 'ai'],
      features: ['authentication', 'analytics'],
      permissions: ['read', 'write']
    },
    'product-browser': {
      collections: ['GFE_WindowProducts', 'GFE_Customers', 'GFE_Quotes'],
      apis: ['backend', 'ai'],
      features: ['authentication', 'analytics', 'wishlist'],
      permissions: ['read', 'write']
    },
    'training-components': {
      collections: ['GFE_TrainingModules', 'GFE_UserProgress'],
      apis: ['backend'],
      features: ['authentication', 'analytics'],
      permissions: ['read', 'write']
    },
    'notebook-command-center': {
      collections: ['GFE_Documents', 'GFE_KnowledgeBase', 'GFE_ApiLibrary', 'GFE_CommandLog'],
      apis: ['backend', 'ai', 'google', 'wix-headless'],
      features: ['authentication', 'analytics', 'admin', 'dual-oauth'],
      permissions: ['read', 'write', 'admin']
    }
  };

  return requirements[widgetType] || {};
};

// Initialize all widgets
export const initializeWidgets = async () => {
  try {
    console.log('Initializing GFE Widgets...');
    
    // Validate system requirements
    const systemCheck = await validateSystemRequirements();
    if (!systemCheck.valid) {
      throw new Error(`System requirements not met: ${systemCheck.errors.join(', ')}`);
    }

    // Initialize shared services
    await initializeSharedServices();

    // Initialize individual widgets
    const initPromises = Object.keys(WIDGET_REGISTRY).map(async (widgetType) => {
      const validation = validateWidget(widgetType);
      if (validation.enabled) {
        console.log(`Initializing ${widgetType}...`);
        return { widgetType, status: 'initialized' };
      }
      return { widgetType, status: 'disabled' };
    });

    const results = await Promise.all(initPromises);
    
    console.log('Widget initialization complete:', results);
    return {
      success: true,
      widgets: results,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Widget initialization failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Validate system requirements
export const validateSystemRequirements = async () => {
  const errors = [];
  
  try {
    // Check API endpoints
    const backendCheck = await fetch(`${WIDGET_CONFIG.API.BACKEND_URL}/health`);
    if (!backendCheck.ok) {
      errors.push('Backend API not accessible');
    }

    // Check authentication
    if (!WIDGET_CONFIG.API.WIX_SITE_ID || !WIDGET_CONFIG.API.GOOGLE_CLIENT_ID) {
      errors.push('Authentication credentials missing');
    }

    // Check required collections (would need to be implemented in backend)
    const requiredCollections = [
      'GFE_WindowProducts',
      'GFE_Quotes',
      'GFE_Customers',
      'GFE_Leads'
    ];

    // Note: Collection validation would need backend endpoint
    
    return {
      valid: errors.length === 0,
      errors: errors,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      valid: false,
      errors: ['System validation failed: ' + error.message],
      timestamp: new Date().toISOString()
    };
  }
};

// Initialize shared services
const initializeSharedServices = async () => {
  try {
    // Initialize analytics service
    await analyticsService.initialize(WIDGET_CONFIG.API.WIX_SITE_ID);
    
    // Initialize API service
    await apiService.initialize({
      backendUrl: WIDGET_CONFIG.API.BACKEND_URL,
      apiGateway: WIDGET_CONFIG.API.API_GATEWAY,
      siteId: WIDGET_CONFIG.API.WIX_SITE_ID
    });

    // Initialize window service
    await windowService.initialize(WIDGET_CONFIG.COLLECTIONS);

    console.log('Shared services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize shared services:', error);
    throw error;
  }
};

// Export all components
export {
  // Main Widgets
  WindowEstimator,
  ProductBrowser,
  TrainingComponents,
  NotebookLMCommandCenter,
  
  // Shared Components
  ErrorBoundary,
  Loading,
  Error,
  
  // Hooks
  useWindowData,
  usePriceCalculation,
  
  // Services
  windowService,
  analyticsService,
  apiService,
  
  // Utils
  api
};

// Default export for easy importing
export default {
  // Components
  WindowEstimator,
  ProductBrowser,
  TrainingComponents,
  NotebookLMCommandCenter,
  
  // Shared
  ErrorBoundary,
  Loading,
  Error,
  
  // Configuration
  WIDGET_CONFIG,
  WIDGET_REGISTRY,
  
  // Functions
  createWidget,
  validateWidget,
  initializeWidgets,
  validateSystemRequirements
};

// Global widget initialization for standalone usage
if (typeof window !== 'undefined') {
  window.GFEWidgets = {
    WindowEstimator,
    ProductBrowser,
    TrainingComponents,
    NotebookLMCommandCenter,
    createWidget,
    validateWidget,
    initializeWidgets,
    config: WIDGET_CONFIG
  };
  
  // Auto-initialize if requested
  if (window.GFE_AUTO_INIT) {
    initializeWidgets().then(result => {
      console.log('GFE Widgets auto-initialization:', result);
      
      // Dispatch custom event for external listeners
      window.dispatchEvent(new CustomEvent('gfe-widgets-initialized', {
        detail: result
      }));
    });
  }
}

// Export for Wix Velo integration
export const wixVeloIntegration = {
  // Initialize widgets for Wix Velo
  initializeForVelo: async (wixConfig) => {
    try {
      // Merge Wix-specific configuration
      const mergedConfig = {
        ...WIDGET_CONFIG,
        ...wixConfig
      };
      
      // Initialize with Wix context
      return await initializeWidgets(mergedConfig);
    } catch (error) {
      console.error('Wix Velo integration failed:', error);
      throw error;
    }
  },
  
  // Create widget for Wix page
  createForWixPage: (widgetType, wixElement, props = {}) => {
    try {
      const widget = createWidget(widgetType, props);
      
      // Mount to Wix element if React is available
      if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
        ReactDOM.render(widget, wixElement);
      }
      
      return widget;
    } catch (error) {
      console.error('Failed to create widget for Wix page:', error);
      throw error;
    }
  }
};