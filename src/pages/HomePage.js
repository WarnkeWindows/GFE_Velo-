/**
 * Good Faith Exteriors - Velo Home Page Controller
 * This script orchestrates the communication between the Wix site (parent)
 * and the various embedded HTML components (iframes).
 *
 * Site ID: 5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4
 * Main Iframe Element: #mainIframe
 */

import wixLocation from 'wix-location';
import { authentication } from 'wix-members';
import { session } from 'wix-storage';
import { submitLeadSecure, logAnalyticsEvent, getSecureQuote, callClaudeAdminAssistant } from 'backend/enhanced-velo-integration';

// --- CONFIGURATION ---
const CONFIG = {
    // API Configuration
    apiGateway: 'https://gfe-api-gateway-aonuaov3.uc.gateway.dev',
    backendUrl: 'https://gfe-backend-837326026335.us-central1.run.app',
    siteId: '5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4',
    
    // Iframe Sources - Using streamlined and integrated components
    iframeSrc: {
        home: 'public/gfe-unified-homepage.html',        // Primary unified homepage with full system integration
        estimator: 'public/ai-window-estimator.html',    // AI-powered window estimator
        measure: 'public/ai-window-measure.html',        // Photo measurement analysis
        products: 'public/product-browser.html',         // Product catalog browser
        chat: 'public/ai-chat-agent.html'               // Standalone chat (if needed)
    },
    
    // Wix Routes - Complete Navigation System
    routes: {
        home: '/',
        estimator: '/good-faith-estimator',
        measure: '/ai-window-measure', 
        products: '/window-products',
        schedule: '/schedule-appointment',
        leadForm: '/contact-us',
        thankYou: '/thank-you',
        myEstimates: '/my-estimates',
        admin: '/admin',
 portal: '/customer-portal',
    },
    
    // Feature flags for cleanup
    features: {
        unifiedHomepage: true,     // Use the unified homepage as primary
        standaloneChat: false,     // Chat is integrated in unified homepage
        legacyIframes: false       // Disable old iframe components
    },
};

// --- GLOBAL STATE ---
let currentUser = null;
let sessionId = null;

// --- INITIALIZATION ---
$w.onReady(async function () {
    console.log('🏠 GFE Velo Home Page Initializing...');
    showNotification('loading', 'Initializing system...');

    // Initialize session
    sessionId = session.getItem('gfeSessionId');
    if (!sessionId) {
        sessionId = `velo_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        session.setItem('gfeSessionId', sessionId);
    }

    await initializeAuthentication();
    initializeIframeCommunication();

    // Load the initial iframe based on the current page path
    loadIframeForCurrentPage();

    logAnalyticsEvent('page_view', {
        path: wixLocation.path,
        url: wixLocation.url,
        userAuthenticated: !!currentUser
    });

    console.log('✅ GFE Velo Home Page Ready. Session ID:', sessionId);
    showNotification('success', 'Welcome to Good Faith Exteriors!', 3000);
});

async function initializeAuthentication() {
    authentication.onLogin(async (user) => {
        console.log('🔐 User logged in:', user.id);
        currentUser = user;
        session.setItem('gfeUser', JSON.stringify(user));
        sendMessageToIframe({ type: 'GFE_USER_DATA', userData: user });
    });

    authentication.onLogout(() => {
        console.log('🔓 User logged out');
        currentUser = null;
        session.removeItem('gfeUser');
        sendMessageToIframe({ type: 'GFE_USER_DATA', userData: null });
    });

    if (authentication.loggedIn()) {
        currentUser = await authentication.getMember();
        console.log('👤 User already authenticated:', currentUser.id);
    }
}

function initializeIframeCommunication() {
    const iframe = $w('#mainIframe');
    if (iframe) {
        iframe.onMessage((event) => {
            if (event.data && event.data.type) {
                handleIframeMessage(event);
            }
        });
    } else {
        console.error("❌ Critical Error: #mainIframe element not found on page.");
        showNotification('error', 'Page content could not be loaded.');
    }
}

function loadIframeForCurrentPage() {
    const path = wixLocation.path[0] || 'home';
    let src = CONFIG.iframeSrc.home; // Default to unified homepage

    // Route-specific iframe loading using streamlined components only
    if (path.includes('estimator')) {
        src = CONFIG.iframeSrc.estimator;
    } else if (path.includes('measure')) {
        src = CONFIG.iframeSrc.measure;
    } else if (path.includes('products')) {
        src = CONFIG.iframeSrc.products;
    } else if (path === 'home' || path === '' || wixLocation.path.length === 0) {
        // Always load the unified homepage - single source of truth
        src = CONFIG.iframeSrc.home;
        console.log('🏠 Loading unified homepage - streamlined UI with full system integration');
    }

    // Validate that we're only loading approved, streamlined components
    const approvedSources = Object.values(CONFIG.iframeSrc);
    if (!approvedSources.includes(src)) {
        console.error(`❌ Attempted to load non-approved iframe: ${src}`);
        src = CONFIG.iframeSrc.home; // Fallback to safe unified homepage
    }

    const iframe = $w('#mainIframe');
    if (iframe) {
        iframe.src = `/${src}`;
        console.log(`📄 Loading streamlined iframe for path "${path}": ${src}`);
        
        // Ensure iframe is visible and properly configured
        iframe.show();
        
        // Add error handling for iframe loading
        iframe.onLoad(() => {
            console.log('✅ Streamlined iframe loaded successfully');
            hideLoadingNotification();
        });
        
    } else {
        console.error("❌ Critical Error: #mainIframe element not found. Please ensure the Wix page has an iframe element with ID 'mainIframe'");
        showNotification('error', 'Page content could not be loaded. Please refresh the page.');
    }
}

// --- IFRAME MESSAGE HANDLING ---

function handleIframeMessage(event) {
    const message = event.data;
    console.log(`📨 Received message from iframe: ${message.type}`);

    switch (message.type) {
        case 'GFE_COMPONENT_READY':
            handleComponentReady(message);
            break;
        case 'GFE_NAVIGATE_TO_ESTIMATOR':
        case 'GFE_NAVIGATE_TO_MEASUREMENT':
        case 'GFE_NAVIGATE_REQUEST':
            handleNavigation(message);
            break;
        case 'GFE_LEAD_CAPTURED':
            handleLeadCapture(message);
            break;
        case 'GFE_QUOTE_REQUEST':
            handleQuoteRequest(message);
            break;
        case 'GFE_ANALYTICS_EVENT':
            logAnalyticsEvent(message.event, { ...message.data, source: 'iframe' });
            break;
        case 'GFE_REQUEST_AUTH_HEADERS':
            handleAuthHeaderRequest(message);
            break;
        case 'GFE_ERROR':
            console.error('❌ Iframe Error:', message.error);
            logAnalyticsEvent('iframe_error', { error: message.error, source: message.source });
            showNotification('error', 'An unexpected error occurred in the application.');
            break;
        default:
            console.warn(`⚠️ Unhandled message type: ${message.type}`);
    }
}

function handleComponentReady(message) {
    console.log(`✅ Component Ready: ${message.source} | Session: ${message.sessionId}`);
    
    // Send comprehensive initial configuration and user data to the newly loaded iframe
    sendMessageToIframe({
        type: 'GFE_CONFIG_UPDATE',
        config: {
            apiGateway: CONFIG.apiGateway,
            backendUrl: CONFIG.backendUrl,
            wixSiteId: CONFIG.siteId || '5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4',
            environment: 'production'
        },
        userData: currentUser,
        sessionId: sessionId,
        capabilities: message.capabilities || [],
        timestamp: Date.now()
    });

    // Send acknowledgment that connection is established
    sendMessageToIframe({
        type: 'GFE_CONNECTION_ACK',
        origin: window.location.origin,
        sessionId: sessionId,
        timestamp: Date.now()
    });

    // If this is the unified homepage, ensure it's fully configured
    if (message.source === 'gfe-home-page') {
        console.log('🏠 Unified homepage is ready and configured');
        showNotification('success', 'Welcome to Good Faith Exteriors!', 3000);
    }
}

function handleNavigation(message) {
    let destination = 'home'; // Default
    
    // Handle different navigation message types with enhanced routing
    if (message.type === 'GFE_NAVIGATE_TO_ESTIMATOR') destination = 'estimator';
    else if (message.type === 'GFE_NAVIGATE_TO_MEASUREMENT') destination = 'measure';
    else if (message.type === 'GFE_NAVIGATE_TO_BROWSER') destination = 'products';
    else if (message.type === 'GFE_NAVIGATE_TO_SCHEDULE') destination = 'schedule';
    else if (message.type === 'GFE_NAVIGATE_TO_LEAD_FORM') destination = 'leadForm';
    else if (message.type === 'GFE_NAVIGATE_TO_THANK_YOU') destination = 'thankYou';
    else if (message.type === 'GFE_NAVIGATE_TO_MY_ESTIMATES') destination = 'myEstimates';
    else if (message.type === 'GFE_NAVIGATE_TO_ADMIN') destination = 'admin';
    else if (message.type === 'GFE_NAVIGATE_TO_PORTAL') destination = 'portal';
    else if (message.type === 'GFE_NAVIGATE_TO_CHAT') destination = 'home'; // Chat is on home page
    else if (message.destination) destination = message.destination;

    const targetRoute = CONFIG.routes[destination];
    if (targetRoute) {
        console.log(`🚀 Navigating from ${message.source || 'unknown'} to ${destination} at ${targetRoute}`);
        showNotification('loading', `Loading ${destination === 'home' ? 'home page' : destination}...`);
        
        // Store enhanced context for the destination page including AI chat state
        if (message.userContext) {
            session.setItem('gfeNavigationContext', JSON.stringify({
                ...message.userContext,
                sourceUrl: wixLocation.url,
                sourcePage: message.source,
                timestamp: Date.now(),
                sessionId: sessionId,
                userAuthenticated: !!currentUser
            }));
        }
        
        // Store AI chat context for seamless transitions
        if (message.chatContext) {
            session.setItem('gfeChatContext', JSON.stringify(message.chatContext));
        }
        
        // Track navigation analytics
        logAnalyticsEvent('page_navigation', {
            from: message.source || 'unknown',
            to: destination,
            route: targetRoute,
            userAuthenticated: !!currentUser,
            hasContext: !!message.userContext
        });
        
        // Perform navigation
        wixLocation.to(targetRoute);
    } else {
        console.warn(`⚠️ Unknown navigation destination: ${destination}`);
        showNotification('error', `Navigation to ${destination} failed. Unknown destination.`);
        logAnalyticsEvent('navigation_error', { destination, availableRoutes: Object.keys(CONFIG.routes) });
    }
}

async function handleLeadCapture(message) {
    console.log('📝 Lead captured:', message.data);
    showNotification('loading', 'Submitting your information...');

    try {
        const leadData = {
            ...message.data,
            source: `iframe-${message.source || 'unknown'}`,
            sessionId: sessionId,
            wixUserId: currentUser ? currentUser._id : null
        };

        const result = await submitLeadSecure(leadData, currentUser ? currentUser.sessionToken : null);

        if (result.success) {
            console.log('✅ Lead submitted successfully to backend. ID:', result.leadId);
            showNotification('success', 'Thank you! Our team will contact you shortly.');
            sendMessageToIframe({ type: 'GFE_LEAD_SUBMITTED_SUCCESS', leadId: result.leadId });
        } else {
            throw new Error(result.error || 'Failed to submit lead to backend.');
        }
    } catch (error) {
        console.error('❌ Lead submission failed:', error);
        logAnalyticsEvent('lead_submission_failed', { error: error.message });
        showNotification('error', 'Could not submit your information. Please try again or call us.');
        sendMessageToIframe({ type: 'GFE_LEAD_SUBMITTED_ERROR', error: error.message });
    }
}

async function handleQuoteRequest(message) {
    console.log('💰 Quote requested:', message.data);
    showNotification('loading', 'Generating your quote...');

    try {
        const result = await getSecureQuote(message.data, currentUser ? currentUser._id : null);
        if (result.success) {
            console.log('✅ Quote generated:', result.quote);
            showNotification('success', 'Your quote has been generated and saved to your profile.');
            sendMessageToIframe({ type: 'GFE_QUOTE_GENERATED', quote: result.quote });
        } else {
            throw new Error(result.error || 'Failed to generate quote.');
        }
    } catch (error) {
        console.error('❌ Quote generation failed:', error);
        logAnalyticsEvent('quote_generation_failed', { error: error.message });
        showNotification('error', 'Could not generate your quote. Please contact support.');
        sendMessageToIframe({ type: 'GFE_QUOTE_GENERATION_ERROR', error: error.message });
    }
}

async function handleAuthHeaderRequest(message) {
    console.log('🔐 Auth headers requested from iframe:', message.sessionId);
    
    try {
        // Import the backend service to get OAuth headers
        const { getOAuthHeaders } = await import('backend/enhanced-velo-integration');
        
        // Get comprehensive OAuth headers including Google Cloud credentials
        const authHeaders = await getOAuthHeaders(
            currentUser ? currentUser.sessionToken : null,
            {
                source: 'iframe_auth_request',
                sessionId: message.sessionId,
                userAgent: navigator.userAgent,
                timestamp: Date.now()
            }
        );
        
        // Send auth headers to iframe
        sendMessageToIframe({
            type: 'GFE_AUTH_HEADERS_RESPONSE',
            sessionId: message.sessionId,
            headers: authHeaders,
            userContext: {
                authenticated: !!currentUser,
                userId: currentUser ? currentUser._id : null,
                timestamp: Date.now()
            }
        });
        
        console.log('✅ Auth headers sent to iframe with Google Cloud credentials');
    } catch (error) {
        console.error('❌ Failed to provide auth headers:', error);
        sendMessageToIframe({
            type: 'GFE_AUTH_HEADERS_ERROR',
            sessionId: message.sessionId,
            error: 'Failed to retrieve authentication headers'
        });
    }
}

// --- UTILITY FUNCTIONS ---

/**
 * Sends a message to the main iframe.
 * @param {object} message - The message object to send.
 */
function sendMessageToIframe(message) {
    const iframe = $w('#mainIframe');
    if (iframe) {
        console.log(`📤 Sending message to iframe: ${message.type}`);
        iframe.postMessage(message, '*');
    } else {
        console.error("Cannot send message: #mainIframe not found.");
    }
}

/**
 * Displays a notification message on the page.
 * Assumes a hidden text element #notificationText and a container #notificationBox exist.
 * @param {'success'|'error'|'loading'} type - The type of notification.
 * @param {string} message - The message to display.
 * @param {number} [duration=5000] - How long to show the message in ms.
 */
function showNotification(type, message, duration = 5000) {
    const notificationBox = $w('#notificationBox');
    const notificationText = $w('#notificationText');
    const loadingIndicator = $w('#loadingIndicator');

    if (!notificationBox || !notificationText || !loadingIndicator) {
        console.log(`UI NOTIFICATION [${type}]: ${message}`);
        return;
    }

    notificationText.text = message;

    // Reset styles
    notificationBox.style.backgroundColor = '#333';
    loadingIndicator.hide();

    switch (type) {
        case 'success':
            notificationBox.style.backgroundColor = '#48BB78'; // Green
            break;
        case 'error':
            notificationBox.style.backgroundColor = '#F56565'; // Red
            break;
        case 'loading':
            notificationBox.style.backgroundColor = '#3B82F6'; // Blue
            loadingIndicator.show();
            break;
    }

    notificationBox.show('fade', { duration: 300 });

    if (type !== 'loading') {
        setTimeout(() => {
            notificationBox.hide('fade', { duration: 300 });
        }, duration);
    }
}

/**
 * Hides the loading notification.
 */
function hideLoadingNotification() {
    const notificationBox = $w('#notificationBox');
    if (notificationBox) {
        notificationBox.hide('fade', { duration: 300 });
    }
}

// --- NAVIGATION HANDLERS (for on-page buttons) ---

export function homeButton_click(event) {
    if (wixLocation.path[0] !== 'home') {
        wixLocation.to(CONFIG.routes.home);
    }
}

export function estimatorButton_click(event) {
    if (!wixLocation.url.includes(CONFIG.routes.estimator)) {
        wixLocation.to(CONFIG.routes.estimator);
    }
}
