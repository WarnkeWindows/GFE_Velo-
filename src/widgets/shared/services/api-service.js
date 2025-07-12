/**
 * Comprehensive API Service for GFE Frontend Components
 * Integrates with all backend APIs and services
 */

class APIService {
  constructor() {
    this.config = {
      wix: {
        siteId: '5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4',
        backendUrl: 'https://gfe-backend-837326026335.us-central1.run.app'
      },
      timeout: 30000,
      maxRetries: 3
    };
    
    this.sessionId = `frontend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Call Wix backend function with comprehensive error handling
   */
  async callBackendFunction(functionName, ...args) {
    const startTime = Date.now();
    
    try {
      // Check if running in Wix environment
      if (typeof window !== 'undefined' && window.wixClient) {
        // Use Wix client API
        const response = await window.wixClient.backend.callFunction(functionName, args);
        
        // Track API call success
        this.trackApiCall(functionName, 'success', Date.now() - startTime);
        
        return response;
      } else {
        // Fallback to direct HTTP call
        return await this.makeHttpCall(`/api/backend/${functionName}`, 'POST', args);
      }
    } catch (error) {
      console.error(`Backend function call failed: ${functionName}`, error);
      
      // Track API call failure
      this.trackApiCall(functionName, 'error', Date.now() - startTime, error.message);
      
      throw error;
    }
  }

  /**
   * Make HTTP call with retry logic
   */
  async makeHttpCall(endpoint, method = 'GET', data = null, options = {}) {
    const url = `${this.config.wix.backendUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Wix-Site-Id': this.config.wix.siteId,
      'X-Session-ID': this.sessionId,
      'X-Source': 'frontend-widget',
      ...options.headers
    };

    const requestOptions = {
      method,
      headers,
      timeout: this.config.timeout,
      ...options
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(data);
    }

    let lastError;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Track successful API call
        this.trackApiCall(endpoint, 'success', 0);
        
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`API call attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    // Track failed API call
    this.trackApiCall(endpoint, 'error', 0, lastError.message);
    
    throw lastError;
  }

  /**
   * Call Anthropic Claude API
   */
  async callClaude(prompt, options = {}) {
    try {
      return await this.callBackendFunction('callAnthropicClaude', prompt, options);
    } catch (error) {
      console.error('Claude API call failed:', error);
      throw new Error('AI chat service temporarily unavailable');
    }
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(prompt, options = {}) {
    try {
      return await this.callBackendFunction('callOpenAI', prompt, options);
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw new Error('AI chat service temporarily unavailable');
    }
  }

  /**
   * Call Google AI Studio
   */
  async callGoogleAI(prompt, options = {}) {
    try {
      return await this.callBackendFunction('callGoogleAIStudio', prompt, options);
    } catch (error) {
      console.error('Google AI Studio call failed:', error);
      throw new Error('AI chat service temporarily unavailable');
    }
  }

  /**
   * Analyze image with Google Cloud Vision
   */
  async analyzeImage(imageData, features = ['TEXT_DETECTION', 'OBJECT_LOCALIZATION']) {
    try {
      return await this.callBackendFunction('analyzeImageWithVision', imageData, features);
    } catch (error) {
      console.error('Image analysis failed:', error);
      throw new Error('Image analysis service temporarily unavailable');
    }
  }

  /**
   * Generate PDF document
   */
  async generatePDF(templateId, data, options = {}) {
    try {
      return await this.callBackendFunction('generatePDF', templateId, data, options);
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error('PDF generation service temporarily unavailable');
    }
  }

  /**
   * Process document with Mindee
   */
  async processDocument(documentUrl, documentType = 'invoice') {
    try {
      return await this.callBackendFunction('extractDocumentData', documentUrl, documentType);
    } catch (error) {
      console.error('Document processing failed:', error);
      throw new Error('Document processing service temporarily unavailable');
    }
  }

  /**
   * Submit lead to CRM
   */
  async submitLead(leadData) {
    try {
      // Submit to backend
      const response = await this.callBackendFunction('submitLeadSecure', leadData);
      
      // Also update CRM
      await this.callBackendFunction('updateCRMData', leadData, 'append');
      
      return response;
    } catch (error) {
      console.error('Lead submission failed:', error);
      throw new Error('Lead submission failed. Please try again.');
    }
  }

  /**
   * Get AI-powered quote
   */
  async getAIQuote(quoteData) {
    try {
      return await this.callBackendFunction('getSecureQuote', quoteData);
    } catch (error) {
      console.error('AI quote generation failed:', error);
      throw new Error('Quote generation service temporarily unavailable');
    }
  }

  /**
   * Process AI chat request with multiple providers
   */
  async processAIChat(message, provider = 'anthropic', options = {}) {
    try {
      return await this.callBackendFunction('processAIChatRequest', message, provider, options);
    } catch (error) {
      console.error('AI chat processing failed:', error);
      throw new Error('AI chat service temporarily unavailable');
    }
  }

  /**
   * Log error to Sentry
   */
  async logError(error, context = {}) {
    try {
      await this.callBackendFunction('logErrorToSentry', error, {
        ...context,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    } catch (logError) {
      console.warn('Failed to log error to Sentry:', logError);
    }
  }

  /**
   * Trigger Zapier webhook
   */
  async triggerZapier(webhookUrl, data) {
    try {
      return await this.callBackendFunction('triggerZapierWebhook', webhookUrl, data);
    } catch (error) {
      console.error('Zapier webhook failed:', error);
      throw new Error('Automation trigger failed');
    }
  }

  /**
   * Deploy to Vercel
   */
  async deployToVercel(projectId, deploymentData) {
    try {
      return await this.callBackendFunction('deployToVercel', projectId, deploymentData);
    } catch (error) {
      console.error('Vercel deployment failed:', error);
      throw new Error('Deployment failed');
    }
  }

  /**
   * Perform comprehensive health check
   */
  async healthCheck() {
    try {
      return await this.callBackendFunction('performHealthCheck');
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Track API call metrics
   */
  trackApiCall(endpoint, status, responseTime, error = null) {
    const trackingData = {
      endpoint,
      status,
      responseTime,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      error
    };

    // Log to console for debugging
    console.log('API Call Tracked:', trackingData);

    // Send to analytics (if available)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'api_call', {
        event_category: 'API Performance',
        event_label: endpoint,
        value: responseTime,
        custom_parameter_1: status
      });
    }

    // Store in local storage for offline analysis
    try {
      const apiMetrics = JSON.parse(localStorage.getItem('gfe_api_metrics') || '[]');
      apiMetrics.push(trackingData);
      
      // Keep only last 100 entries
      if (apiMetrics.length > 100) {
        apiMetrics.splice(0, apiMetrics.length - 100);
      }
      
      localStorage.setItem('gfe_api_metrics', JSON.stringify(apiMetrics));
    } catch (e) {
      console.warn('Failed to store API metrics:', e);
    }
  }

  /**
   * Get API metrics for debugging
   */
  getApiMetrics() {
    try {
      return JSON.parse(localStorage.getItem('gfe_api_metrics') || '[]');
    } catch (e) {
      console.warn('Failed to retrieve API metrics:', e);
      return [];
    }
  }

  /**
   * Clear API metrics
   */
  clearApiMetrics() {
    try {
      localStorage.removeItem('gfe_api_metrics');
    } catch (e) {
      console.warn('Failed to clear API metrics:', e);
    }
  }

  /**
   * Upload file to Google Cloud Storage
   */
  async uploadFile(file, bucketName = 'gfe-user-uploads') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucketName);

      const response = await this.makeHttpCall('/api/upload', 'POST', formData, {
        headers: {
          // Don't set Content-Type for FormData
        }
      });

      return response;
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error('File upload failed');
    }
  }

  /**
   * Query NotebookLM
   */
  async queryNotebookLM(query, notebookId, options = {}) {
    try {
      return await this.callBackendFunction('queryNotebookLM', query, notebookId, options);
    } catch (error) {
      console.error('NotebookLM query failed:', error);
      throw new Error('Knowledge base query failed');
    }
  }

  /**
   * Get system configuration
   */
  async getSystemConfig() {
    try {
      return await this.callBackendFunction('getSystemConfiguration');
    } catch (error) {
      console.error('Failed to get system config:', error);
      // Return default config
      return {
        features: {
          aiEnabled: false,
          visionEnabled: false,
          pdfEnabled: false
        }
      };
    }
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;