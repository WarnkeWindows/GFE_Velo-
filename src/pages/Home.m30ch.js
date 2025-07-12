/**
 * Good Faith Exteriors - Home Page
 * Enhanced with MCP integration and backend services
 * Site ID: 5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4
 */

import wixLocation from 'wix-location';
import { authentication } from 'wix-members';
import { session } from 'wix-storage';
import { 
    submitLeadSecure, 
    logAnalyticsEvent, 
    getSecureQuote, 
    aiChatWithClaude,
    checkSystemHealth
} from 'backend/gfe-service';
import { callAdminAssistant } from 'backend/admin-integration';

// --- CONFIGURATION ---
const CONFIG = {
    siteId: '5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4',
    mcpServices: {
        claude: 'https://gfe-claude-mcp-837326026335.us-central1.run.app',
        backend: 'https://gfe-backend-837326026335.us-central1.run.app',
        gateway: 'https://gfe-api-gateway-aonuaov3.uc.gateway.dev'
    },
    iframeSrc: 'public/gfe-home-iframe.html',
    routes: {
        estimator: '/good-faith-estimator',
        products: '/window-products',
        schedule: '/schedule-appointment',
        aiMeasure: '/ai-window-measure'
    }
};

// Global state
let currentUser = null;
let sessionId = null;
let aiChatActive = false;
let mcpSystemReady = false;

$w.onReady(async function () {
    console.log('🏠 Home page with MCP integration initializing...');
    
    // Initialize session
    sessionId = session.getItem('gfeSessionId') || `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    session.setItem('gfeSessionId', sessionId);
    
    // Initialize MCP system
    await initializeMCPSystem();
    
    // Initialize authentication
    await initializeAuthentication();
    
    // Initialize iframe communication
    initializeIframeCommunication();
    
    // Load the home iframe
    loadHomeIframe();
    
    // Setup UI handlers
    setupUIHandlers();
    
    // Initialize AI chat with MCP
    initializeAIChat();
    
    // Track page view
    logAnalyticsEvent('mcp_home_page_view', {
        path: wixLocation.path,
        sessionId: sessionId,
        userAuthenticated: !!currentUser,
        mcpSystemReady: mcpSystemReady
    });
    
    console.log('✅ MCP Home page ready');
});

async function initializeMCPSystem() {
    try {
        console.log('🔧 Initializing MCP system...');
        
        // Health check for all MCP services
        const healthPromises = [
            checkSystemHealth(),
            checkMCPServiceHealth('claude'),
            checkMCPServiceHealth('backend')
        ];
        
        const healthResults = await Promise.allSettled(healthPromises);
        
        mcpSystemReady = healthResults.some(result => 
            result.status === 'fulfilled' && result.value?.status === 'healthy'
        );
        
        if (mcpSystemReady) {
            console.log('✅ MCP System operational');
            showSystemStatus('MCP System Ready', 'success');
        } else {
            console.warn('⚠️ MCP System partially available');
            showSystemStatus('MCP System Limited', 'warning');
        }
        
        // Initialize MCP widgets if available
        if (typeof window !== 'undefined' && window.GFEWidgets) {
            await window.GFEWidgets.initializeWidgets();
        }
        
    } catch (error) {
        console.error('❌ MCP System initialization failed:', error);
        showSystemStatus('MCP System Offline', 'error');
        mcpSystemReady = false;
    }
}

async function checkMCPServiceHealth(service) {
    try {
        const url = `${CONFIG.mcpServices[service]}/health`;
        const response = await fetch(url, { 
            method: 'GET',
            timeout: 5000 
        });
        
        if (response.ok) {
            const data = await response.json();
            return { service, status: 'healthy', data };
        } else {
            return { service, status: 'unhealthy', error: response.status };
        }
    } catch (error) {
        return { service, status: 'error', error: error.message };
    }
}

function showSystemStatus(message, type) {
    if ($w('#mcpSystemStatus')) {
        $w('#mcpSystemStatus').text = message;
        $w('#mcpSystemStatus').style.color = type === 'success' ? '#38A169' : 
                                            type === 'warning' ? '#ED8936' : '#E53E3E';
        $w('#mcpSystemStatus').show();
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if ($w('#mcpSystemStatus')) {
                $w('#mcpSystemStatus').hide();
            }
        }, 5000);
    }
}

async function initializeAuthentication() {
    if (authentication.loggedIn()) {
        currentUser = await authentication.getMember();
        console.log('👤 User authenticated:', currentUser.id);
    }
    
    authentication.onLogin(async (user) => {
        currentUser = user;
        sendMessageToIframe({ 
            type: 'GFE_USER_DATA', 
            userData: user,
            mcpSession: sessionId 
        });
    });
    
    authentication.onLogout(() => {
        currentUser = null;
        sendMessageToIframe({ 
            type: 'GFE_USER_DATA', 
            userData: null,
            mcpSession: sessionId 
        });
    });
}

function initializeIframeCommunication() {
    const iframe = $w('#homeIframe');
    if (iframe) {
        iframe.onMessage((event) => {
            if (event.data && event.data.type) {
                handleIframeMessage(event);
            }
        });
    } else {
        console.error("❌ Critical Error: #homeIframe element not found.");
    }
}

function loadHomeIframe() {
    const iframe = $w('#homeIframe');
    if (iframe) {
        iframe.src = `/${CONFIG.iframeSrc}`;
        iframe.show();

        iframe.onLoad(() => {
            console.log('✅ Home iframe loaded successfully');
            // Send initial MCP configuration
            setTimeout(() => {
                sendMessageToIframe({
                    type: 'GFE_MCP_CONFIG_UPDATE',
                    config: {
                        ...CONFIG.mcpServices,
                        siteId: CONFIG.siteId,
                        environment: 'production',
                        mcpSystemReady: mcpSystemReady
                    },
                    userData: currentUser,
                    sessionId: sessionId
                });
            }, 1000);
        });
    }
}

function setupUIHandlers() {
    // MCP Window Estimator
    if ($w('#mcpEstimatorButton')) {
        $w('#mcpEstimatorButton').onClick(() => {
            navigateToMCPEstimator();
        });
    }
    
    // MCP Product Browser
    if ($w('#mcpProductsButton')) {
        $w('#mcpProductsButton').onClick(() => {
            navigateToMCPProducts();
        });
    }
    
    // MCP AI Chat
    if ($w('#mcpAIChatButton')) {
        $w('#mcpAIChatButton').onClick(() => {
            toggleMCPAIChat();
        });
    }
    
    // MCP Admin Panel
    if ($w('#mcpAdminButton')) {
        $w('#mcpAdminButton').onClick(() => {
            toggleMCPAdminPanel();
        });
    }
    
    // MCP System Dashboard
    if ($w('#mcpDashboardButton')) {
        $w('#mcpDashboardButton').onClick(() => {
            openMCPDashboard();
        });
    }
}

async function initializeAIChat() {
    try {
        const welcomeMessage = await callAdminAssistant(
            'User is on the MCP-enabled home page. Provide a brief welcome highlighting MCP capabilities.',
            {
                sessionId: sessionId,
                context: {
                    source: 'mcp_home_page',
                    userAuthenticated: !!currentUser,
                    mcpSystemReady: mcpSystemReady,
                    capabilities: ['mcp-estimation', 'ai-analysis', 'admin-tools', 'system-monitoring']
                }
            }
        );

        if ($w('#mcpWelcomeText')) {
            $w('#mcpWelcomeText').text = welcomeMessage.response || 
                'Welcome to Good Faith Exteriors with MCP integration! I can help with advanced window estimates, AI analysis, and system management.';
        }
    } catch (error) {
        console.warn('MCP AI chat initialization failed:', error);
        if ($w('#mcpWelcomeText')) {
            $w('#mcpWelcomeText').text = 'Welcome to Good Faith Exteriors! MCP system is initializing...';
        }
    }
}

// Message handling with MCP support
function handleIframeMessage(event) {
    const message = event.data;
    console.log(`📨 MCP Home received message: ${message.type}`);
    
    switch (message.type) {
        case 'GFE_MCP_COMPONENT_READY':
            handleMCPComponentReady(message);
            break;
        case 'GFE_MCP_ESTIMATION_REQUEST':
            handleMCPEstimationRequest(message);
            break;
        case 'GFE_MCP_AI_ANALYSIS':
            handleMCPAIAnalysis(message);
            break;
        case 'GFE_MCP_ADMIN_COMMAND':
            handleMCPAdminCommand(message);
            break;
        case 'GFE_SUBMIT_LEAD':
            handleLeadSubmission(message);
            break;
        case 'GFE_AI_CHAT_MESSAGE':
            handleAIChatMessage(message);
            break;
        case 'GFE_ERROR':
            console.error('❌ MCP Home Iframe Error:', message.error);
            logAnalyticsEvent('mcp_home_iframe_error', { error: message.error });
            break;
    }
}

function handleMCPComponentReady(message) {
    console.log('✅ MCP iframe component ready');
    
    // Send comprehensive MCP configuration
    sendMessageToIframe({
        type: 'GFE_MCP_CONFIG_UPDATE',
        config: {
            ...CONFIG.mcpServices,
            siteId: CONFIG.siteId,
            routes: CONFIG.routes,
            mcpSystemReady: mcpSystemReady
        },
        userData: currentUser,
        sessionId: sessionId,
        mcpCapabilities: {
            aiEstimation: true,
            imageAnalysis: true,
            adminTools: true,
            systemMonitoring: true
        }
    });
}

async function handleMCPEstimationRequest(message) {
    try {
        console.log('🔧 Processing MCP estimation request');
        
        const estimationData = {
            ...message.estimationData,
            sessionId: sessionId,
            source: 'mcp_home_page',
            mcpEnhanced: true
        };
        
        const result = await getSecureQuote(estimationData, currentUser?.id);
        
        sendMessageToIframe({
            type: 'GFE_MCP_ESTIMATION_RESPONSE',
            estimation: result,
            requestId: message.requestId
        });
        
        logAnalyticsEvent('mcp_estimation_completed', {
            sessionId: sessionId,
            estimationId: result.quoteId
        });
        
    } catch (error) {
        console.error('❌ MCP estimation failed:', error);
        sendMessageToIframe({
            type: 'GFE_MCP_ESTIMATION_ERROR',
            error: 'MCP estimation failed. Please try again.',
            requestId: message.requestId
        });
    }
}

async function handleMCPAIAnalysis(message) {
    try {
        console.log('🤖 Processing MCP AI analysis');
        
        const analysisRequest = {
            ...message.analysisData,
            sessionId: sessionId,
            mcpContext: 'home_page_analysis'
        };
        
        const response = await aiChatWithClaude(
            message.prompt || 'Analyze the provided data using MCP capabilities',
            message.history || [],
            analysisRequest
        );
        
        sendMessageToIframe({
            type: 'GFE_MCP_AI_ANALYSIS_RESPONSE',
            analysis: response,
            requestId: message.requestId
        });
        
    } catch (error) {
        console.error('❌ MCP AI analysis failed:', error);
        sendMessageToIframe({
            type: 'GFE_MCP_AI_ANALYSIS_ERROR',
            error: 'MCP AI analysis failed. Please try again.',
            requestId: message.requestId
        });
    }
}

async function handleMCPAdminCommand(message) {
    try {
        console.log('⚙️ Processing MCP admin command');
        
        const response = await callAdminAssistant(
            message.command,
            {
                sessionId: sessionId,
                context: {
                    source: 'mcp_home_admin',
                    userRole: currentUser?.role || 'user',
                    mcpAdmin: true,
                    ...message.context
                }
            }
        );
        
        sendMessageToIframe({
            type: 'GFE_MCP_ADMIN_RESPONSE',
            response: response.response,
            requestId: message.requestId
        });
        
    } catch (error) {
        console.error('❌ MCP admin command failed:', error);
        sendMessageToIframe({
            type: 'GFE_MCP_ADMIN_ERROR',
            error: 'MCP admin command failed. Please check permissions.',
            requestId: message.requestId
        });
    }
}

async function handleLeadSubmission(message) {
    const leadData = {
        ...message.leadData,
        source: 'mcp_home_page',
        sessionId: sessionId,
        mcpEnhanced: true
    };
    
    try {
        console.log('📝 Processing MCP lead submission');
        
        const result = await submitLeadSecure(leadData);

        if (result.success) {
            sendMessageToIframe({
                type: 'GFE_MCP_LEAD_SUCCESS',
                leadId: result.leadId,
                message: 'Thank you! Our MCP-enhanced system will process your request.'
            });

            logAnalyticsEvent('mcp_lead_submitted', {
                leadId: result.leadId,
                source: 'mcp_home_page'
            });
        } else {
            throw new Error('MCP lead submission failed');
        }
    } catch (error) {
        console.error('❌ MCP lead submission error:', error);
        sendMessageToIframe({
            type: 'GFE_MCP_LEAD_ERROR',
            error: 'Failed to submit lead through MCP system. Please try again.'
        });
    }
}

async function handleAIChatMessage(message) {
    console.log('🤖 MCP AI chat message received:', message.userMessage);
    
    try {
        const response = await aiChatWithClaude(
            message.userMessage,
            message.history || [],
            {
                sessionId: sessionId,
                context: {
                    source: 'mcp_home_page_chat',
                    mcpEnhanced: true,
                    userContext: message.context || {},
                    conversationHistory: message.history || []
                }
            }
        );

        sendMessageToIframe({
            type: 'GFE_MCP_AI_CHAT_RESPONSE',
            response: response.response,
            requestId: message.requestId,
            mcpMetadata: {
                sessionId: sessionId,
                systemReady: mcpSystemReady
            }
        });
    } catch (error) {
        console.error('❌ MCP AI chat failed:', error);
        sendMessageToIframe({
            type: 'GFE_MCP_AI_CHAT_ERROR',
            error: 'MCP AI assistant temporarily unavailable',
            requestId: message.requestId
        });
    }
}

// Navigation functions with MCP support
function navigateToMCPEstimator() {
    console.log('🏠 Navigating to MCP Estimator');
    
    session.setItem('gfeMCPContext', JSON.stringify({
        sourceUrl: wixLocation.url,
        sourcePage: 'mcp_home',
        mcpSessionId: sessionId,
        timestamp: Date.now()
    }));
    
    logAnalyticsEvent('navigate_to_mcp_estimator', {
        sessionId: sessionId
    });
    
    wixLocation.to(CONFIG.routes.estimator);
}

function navigateToMCPProducts() {
    console.log('🏠 Navigating to MCP Products');
    
    session.setItem('gfeMCPContext', JSON.stringify({
        sourceUrl: wixLocation.url,
        sourcePage: 'mcp_home',
        mcpSessionId: sessionId,
        timestamp: Date.now()
    }));
    
    logAnalyticsEvent('navigate_to_mcp_products', {
        sessionId: sessionId
    });
    
    wixLocation.to(CONFIG.routes.products);
}

async function toggleMCPAIChat() {
    aiChatActive = !aiChatActive;
    
    if ($w('#mcpAIChatContainer')) {
        if (aiChatActive) {
            $w('#mcpAIChatContainer').show();
            $w('#mcpAIChatContainer').scrollTo();

            if ($w('#mcpAIChatButton')) {
                $w('#mcpAIChatButton').label = 'Hide MCP AI Chat';
            }

            // Start MCP AI conversation
            await startMCPAIConversation();
        } else {
            $w('#mcpAIChatContainer').hide();

            if ($w('#mcpAIChatButton')) {
                $w('#mcpAIChatButton').label = 'MCP AI Chat';
            }
        }
    }
    
    logAnalyticsEvent('mcp_ai_chat_toggled', {
        active: aiChatActive,
        sessionId: sessionId
    });
}

async function toggleMCPAdminPanel() {
    if ($w('#mcpAdminPanel')) {
        const isVisible = $w('#mcpAdminPanel').isVisible;
        
        if (isVisible) {
            $w('#mcpAdminPanel').hide();
            if ($w('#mcpAdminButton')) {
                $w('#mcpAdminButton').label = 'Show MCP Admin';
            }
        } else {
            $w('#mcpAdminPanel').show();
            if ($w('#mcpAdminButton')) {
                $w('#mcpAdminButton').label = 'Hide MCP Admin';
            }
            
            // Initialize admin panel
            await initializeMCPAdminPanel();
        }
    }
    
    logAnalyticsEvent('mcp_admin_panel_toggled', {
        sessionId: sessionId
    });
}

async function openMCPDashboard() {
    // Open MCP system dashboard
    if ($w('#mcpDashboard')) {
        $w('#mcpDashboard').show();
        
        // Update dashboard with current status
        await updateMCPDashboard();
    }
    
    logAnalyticsEvent('mcp_dashboard_opened', {
        sessionId: sessionId
    });
}

async function startMCPAIConversation() {
    try {
        const response = await callAdminAssistant(
            'User wants to start an MCP-enhanced AI conversation. Highlight MCP capabilities and how they can help.',
            {
                sessionId: sessionId,
                context: {
                    currentPage: 'mcp_home',
                    userAuthenticated: !!currentUser,
                    mcpSystemReady: mcpSystemReady
                }
            }
        );

        displayMCPAIMessage(response.response || 'Hello! I am your MCP-enhanced AI assistant. I can help with advanced window analysis, system monitoring, and intelligent recommendations.');
    } catch (error) {
        console.error('❌ MCP AI conversation failed:', error);
        displayMCPAIMessage('Hi! I am your MCP AI assistant. How can I help you today?');
    }
}

async function initializeMCPAdminPanel() {
    try {
        // Load MCP system status
        const systemStatus = await checkSystemHealth();
        
        if ($w('#mcpSystemStatus')) {
            $w('#mcpSystemStatus').text = `System: ${systemStatus.status || 'Unknown'}`;
        }
        
        if ($w('#mcpSessionInfo')) {
            $w('#mcpSessionInfo').text = `Session: ${sessionId}`;
        }
        
        if ($w('#mcpServicesList')) {
            const services = Object.keys(CONFIG.mcpServices);
            $w('#mcpServicesList').text = `Services: ${services.join(', ')}`;
        }
        
    } catch (error) {
        console.error('❌ MCP admin panel initialization failed:', error);
    }
}

async function updateMCPDashboard() {
    try {
        // Update dashboard with real-time MCP data
        const healthData = await Promise.all([
            checkSystemHealth(),
            checkMCPServiceHealth('claude'),
            checkMCPServiceHealth('backend')
        ]);
        
        if ($w('#mcpDashboardContent')) {
            const dashboardHTML = `
                <div class="mcp-dashboard">
                    <h3>MCP System Dashboard</h3>
                    <div class="mcp-services">
                        ${healthData.map(service => `
                            <div class="service-status ${service.status}">
                                <strong>${service.service || 'System'}:</strong> ${service.status}
                            </div>
                        `).join('')}
                    </div>
                    <div class="mcp-session">
                        <strong>Session ID:</strong> ${sessionId}
                    </div>
                    <div class="mcp-timestamp">
                        <strong>Last Updated:</strong> ${new Date().toLocaleString()}
                    </div>
                </div>
            `;
            $w('#mcpDashboardContent').html = dashboardHTML;
        }
        
    } catch (error) {
        console.error('❌ MCP dashboard update failed:', error);
    }
}

function displayMCPAIMessage(message) {
    if ($w('#mcpAIChatMessages')) {
        const timestamp = new Date().toLocaleTimeString();
        const messageHtml = `
            <div class="mcp-ai-message">
                <strong>MCP AI Assistant (${timestamp}):</strong>
                <p>${message}</p>
            </div>
        `;
        $w('#mcpAIChatMessages').html += messageHtml;
        $w('#mcpAIChatMessages').scrollTo();
    }
}

function sendMessageToIframe(message) {
    const iframe = $w('#homeIframe');
    if (iframe) {
        console.log(`📤 Sending MCP message to iframe: ${message.type}`);
        iframe.postMessage({
            ...message,
            mcpSessionId: sessionId,
            mcpSystemReady: mcpSystemReady
        }, '*');
    } else {
        console.error("Cannot send message: #homeIframe not found.");
    }
}

// Export functions for external use
export { 
    navigateToMCPEstimator, 
    navigateToMCPProducts, 
    toggleMCPAIChat,
    toggleMCPAdminPanel,
    openMCPDashboard,
    initializeMCPSystem
};