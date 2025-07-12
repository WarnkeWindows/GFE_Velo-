# GFE Public Components - Iframe Integration System

## Overview

This directory contains all public-facing HTML components for Good Faith Exteriors (GFE) that can be embedded as iframes within the Wix site. Each component is designed to be standalone, fully functional, and capable of seamless parent-child communication.

## 🏗️ Architecture

### Core Components

1. **gfe-home-iframe.html** - Main home page with AI chat integration
2. **gfe-unified-homepage.html** - Enhanced home page with embedded configuration
3. **ai-chat-agent.html** - AI-powered chat interface
4. **ai-window-estimator.html** - Advanced window estimation tool
5. **ai-window-measure.html** - AI-powered window measurement with Google Vision
6. **product-browser.html** - Product catalog with filtering and search
7. **property-analysis-hub.html** - Property analysis and recommendations
8. **window-estimator-iframe.html** - React-based window estimator

### Infrastructure Components

1. **gfe-iframe-container.html** - Universal iframe container with error handling
2. **index.html** - Main entry point and component directory
3. **test-iframe-integration.html** - Comprehensive testing interface

## 🔧 Integration Methods

### Method 1: Direct Integration
Load components directly as iframes:
```html
<iframe src="https://yoursite.com/ai-chat-agent.html" width="100%" height="600"></iframe>
```

### Method 2: Container Integration (Recommended)
Use the universal iframe container for better error handling:
```html
<iframe src="https://yoursite.com/gfe-iframe-container.html?component=chat" width="100%" height="600"></iframe>
```

### Method 3: Dynamic Loading
Load components programmatically using the container:
```javascript
// Send message to container to load specific component
iframe.contentWindow.postMessage({
    type: 'GFE_LOAD_COMPONENT',
    component: 'estimator',
    config: { /* optional config */ }
}, '*');
```

## 📡 Communication Protocol

### Message Types

#### From Child to Parent

| Message Type | Description | Data |
|---|---|---|
| `GFE_COMPONENT_READY` | Component loaded successfully | `{ source, sessionId, capabilities }` |
| `GFE_CONTAINER_READY` | Container loaded successfully | `{ sessionId, component, childMessage }` |
| `GFE_ANALYTICS_EVENT` | Analytics event occurred | `{ event, data, sessionId }` |
| `GFE_LEAD_CAPTURED` | Lead information captured | `{ leadData, sessionId }` |
| `GFE_QUOTE_REQUEST` | Quote requested | `{ quoteData, sessionId }` |
| `GFE_ESTIMATE_GENERATED` | Estimate completed | `{ estimateData, sessionId }` |
| `GFE_MEASUREMENT_COMPLETED` | Measurement finished | `{ measurementData, sessionId }` |
| `GFE_HEALTH_RESPONSE` | Health check response | `{ status, timestamp, sessionId }` |
| `GFE_ERROR` | Error occurred | `{ error, sessionId }` |

#### From Parent to Child

| Message Type | Description | Data |
|---|---|---|
| `GFE_CONFIG_UPDATE` | Configuration update | `{ config }` |
| `GFE_HEALTH_CHECK` | Request health check | `{ timestamp }` |
| `GFE_LOAD_COMPONENT` | Load specific component | `{ component, config }` |
| `GFE_USER_DATA` | User context data | `{ userData }` |
| `GFE_OAUTH_TOKEN` | OAuth token for authentication | `{ token, userContext }` |

### Example Implementation

```javascript
// Parent window (Wix site)
window.addEventListener('message', (event) => {
    const message = event.data;
    
    switch (message.type) {
        case 'GFE_COMPONENT_READY':
            console.log('Component ready:', message.source);
            // Send initial configuration
            iframe.contentWindow.postMessage({
                type: 'GFE_CONFIG_UPDATE',
                config: {
                    API_GATEWAY_URL: 'https://gfe-api-gateway-aonuaov3.uc.gateway.dev',
                    wixSiteId: '5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4'
                }
            }, '*');
            break;
            
        case 'GFE_LEAD_CAPTURED':
            // Process lead data
            submitLeadToWix(message.data);
            break;
            
        case 'GFE_ANALYTICS_EVENT':
            // Track analytics
            gtag('event', message.event, message.data);
            break;
    }
});
```

## 🛠️ Configuration

### Standard Configuration Object

```javascript
const CONFIG = {
    // Google Cloud Backend Services
    API_GATEWAY_URL: 'https://gfe-api-gateway-aonuaov3.uc.gateway.dev',
    BACKEND_URL: 'https://gfe-backend-837326026335.us-central1.run.app',
    PROJECT_ID: 'good-faith-exteriors',
    PROJECT_NUMBER: '837326026335',
    
    // Wix Configuration
    wixSiteId: '5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4',
    wixClientId: '11c09244-492f-4332-9983-e768db711388',
    
    // Component-specific settings
    // (varies by component)
};
```

## 🧪 Testing

### Using the Test Interface

1. Open `test-iframe-integration.html` in a browser
2. Select a component from the dropdown
3. Choose load method (Container or Direct)
4. Click "Load Component"
5. Monitor the communication log for messages
6. Use test buttons to send health checks and config updates

### Test Scenarios

1. **Component Loading**: Test each component loads correctly
2. **Error Handling**: Test behavior when components fail to load
3. **Communication**: Verify message passing works both ways
4. **Configuration**: Test dynamic configuration updates
5. **Health Checks**: Verify components respond to health checks

## 🎯 Best Practices

### For Component Development

1. **Always implement the GFE communication protocol**
2. **Include proper error handling and fallbacks**
3. **Use consistent configuration patterns**
4. **Implement health check responses**
5. **Track analytics events appropriately**

### For Integration

1. **Use the container method for production**
2. **Implement proper error handling in parent window**
3. **Set appropriate iframe sandboxing attributes**
4. **Configure proper CSP headers**
5. **Test across different browsers and devices**

## 🔍 Debugging

### Common Issues

1. **Components not loading**: Check console for errors, verify file paths
2. **Communication not working**: Verify message event listeners are set up
3. **Configuration not applying**: Check message timing and format
4. **CORS issues**: Ensure proper origin handling

### Debug Tools

1. **Test Interface**: Use `test-iframe-integration.html` for comprehensive testing
2. **Browser DevTools**: Monitor console for errors and network requests
3. **Message Logging**: Enable verbose logging in components
4. **Health Checks**: Use health check messages to verify component status

## 📈 Performance Considerations

1. **Lazy Loading**: Load components only when needed
2. **Caching**: Enable proper caching headers for static assets
3. **Minification**: Minify CSS and JavaScript in production
4. **CDN**: Use CDN for external libraries
5. **Compression**: Enable gzip compression

## 🔒 Security

1. **Sandboxing**: Use appropriate iframe sandbox attributes
2. **Origin Validation**: Validate message origins
3. **Data Sanitization**: Sanitize all user inputs
4. **CSP Headers**: Implement proper Content Security Policy
5. **HTTPS**: Always use HTTPS in production

## 📚 Component Documentation

### gfe-home-iframe.html
- **Purpose**: Main home page with AI chat
- **Features**: Navigation, chat interface, status indicators
- **Communication**: Full protocol support
- **Dependencies**: Sentry, Google Fonts

### ai-chat-agent.html
- **Purpose**: AI-powered customer chat
- **Features**: NLP, conversation history, quick actions
- **Communication**: Chat events, lead capture
- **Dependencies**: AI services, React (optional)

### ai-window-estimator.html
- **Purpose**: Advanced window estimation
- **Features**: Multi-window input, AI pricing, material selection
- **Communication**: Estimate events, lead capture
- **Dependencies**: Google Cloud APIs

### ai-window-measure.html
- **Purpose**: AI-powered window measurement
- **Features**: Photo upload, Google Vision API, multiple methods
- **Communication**: Measurement events, analytics
- **Dependencies**: Google Vision API

### product-browser.html
- **Purpose**: Product catalog browsing
- **Features**: Filtering, search, wishlist, quotes
- **Communication**: Product selection, quote requests
- **Dependencies**: Product data API

### property-analysis-hub.html
- **Purpose**: Property analysis and recommendations
- **Features**: Photo analysis, efficiency calculations
- **Communication**: Analysis results, recommendations
- **Dependencies**: Analysis services

## 🚀 Deployment

### Production Checklist

1. **✅ All components tested individually**
2. **✅ Iframe integration tested**
3. **✅ Error handling verified**
4. **✅ Performance optimized**
5. **✅ Security measures implemented**
6. **✅ Analytics tracking configured**
7. **✅ Documentation updated**

### Environment Configuration

- **Development**: Use local API endpoints
- **Staging**: Use staging API endpoints
- **Production**: Use production API endpoints with proper authentication

## 📞 Support

For technical issues or questions:
- **Email**: support@goodfaithexteriors.com
- **Phone**: (651) 416-8669
- **Repository**: Internal GFE development repository

---

**Last Updated**: 2024-01-10  
**Version**: 2.0.0  
**Author**: GFE Development Team