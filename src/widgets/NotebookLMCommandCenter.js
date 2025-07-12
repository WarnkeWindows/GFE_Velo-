/**
 * NotebookLM-Style Command Center Widget
 * Good Faith Exteriors - Grid-Flow-Engine Integration
 * 
 * A comprehensive AI-powered command center widget that provides:
 * - NotebookLM-style interface for document and data management
 * - Dual OAuth system (Google + Wix Headless)
 * - Real-time API library management
 * - Administrative controls for all site systems
 * - Advanced analytics and monitoring capabilities
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetch } from 'wix-fetch';
import { analytics } from 'wix-analytics';
import { session } from 'wix-storage';
import { authentication } from 'wix-members';

// Enhanced Configuration with Updated Credentials
const ENHANCED_CONFIG = {
    // Updated Google OAuth & Workspace
    GOOGLE: {
        CLIENT_ID: window.GFE_GOOGLE_CLIENT_ID || 'configured-via-secrets',
        CLIENT_SECRET: window.GFE_GOOGLE_CLIENT_SECRET || 'configured-via-secrets',
        API_KEY: 'AIzaSyAhW8xfvCJdICXKYEMqYidCWP2IhUnSaVY',
        ORGANIZATION_ID: '518845478181',
        PROJECT_ID: 'good-faith-exteriors',
        PROJECT_NUMBER: '837326026335',
        SERVICE_ACCOUNT: '837326026335-compute@developer.gserviceaccount.com',
        SCOPES: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/bigquery'
        ]
    },
    
    // Updated Wix Headless Dual System
    WIX: {
        PRIMARY: {
            CLIENT_ID: 'b32df066-e276-4d06-b9ee-18187d7b1439',
            APP_NAME: 'Grid-Flow Engine',
            ADMIN_API_NAME: 'GRID_FLOW_ENGINE',
            ACCOUNT_ID: '10d52dd8-ec9b-4453-adbc-6293b99af499',
            ADMIN_TOKEN: 'IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjkzZDliYjczLWY3MTAtNDcwNy1iNjQ1LWVmNDE2YWQ5YjEwYVwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjBiNTRlNjE2LTdiZDYtNDhmNi1hYjVjLWI5YWVhNjJmZmFmY1wifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxMGQ1MmRkOC1lYzliLTQ0NTMtYWRiYy02MjkzYjk5YWY0OTlcIn19IiwiaWF0IjoxNzUxMjEyMjAwfQ.LgzLe_jVQSs4q18sXb8Mj9laOO1Y0j8CY2xAIbtgKOlOB40B3sOgDon3BoVD-NQD8VFa5cMfAweX-rrznwP6DEhdi7DeQOnE7kPOv-HOzYdcsoWpAK-r8ln4cK6zBIJ_gr_Nd6f7IglNwUUX4LKoxZngyEwvL2-1HzI6Aamuxu0_OfgerNT0aULer61By8LfPz1cvOTsWQMF6CFAkNeFPn5KJ6zqYbb4KbXKdtdj4z_61aTzdU1uU5dmxvFI29OZvFi8XtA5vIvJJTS5nfrImynZqARzk6HalCjNBs3xbz2TYFs51fQmHyLTK8Sy_I5ZyAuRnPv0Eh4kWdkJhZQtbQ'
        },
        SECONDARY: {
            CLIENT_ID: '5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4',
            APP_NAME: 'GFE Velo Integration',
            SITE_ID: 'b8574bad-dbbc-46a3-8d76-941a7101e5ac',
            METASITE_ID: '5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4'
        },
        API_BASE_URL: 'https://www.wixapis.com'
    },
    
    // Enhanced API Gateway Configuration
    API_GATEWAY: {
        PRIMARY_URL: 'https://gfe-api-gateway-aonuaov3.uc.gateway.dev',
        BACKEND_URL: 'https://gfe-backend-837326026335.us-central1.run.app',
        ENDPOINTS: {
            HEALTH: '/health',
            AUTH: '/api/auth',
            PRODUCTS: '/api/products',
            QUOTES: '/api/quotes',
            CUSTOMERS: '/api/customers',
            ANALYTICS: '/api/analytics',
            NOTEBOOK: '/api/notebook',
            AI_CHAT: '/api/ai/chat',
            DOCUMENT_PROCESSING: '/api/documents'
        }
    },
    
    // NotebookLM Features
    NOTEBOOK_LM: {
        FEATURES: {
            DOCUMENT_UPLOAD: true,
            AI_CHAT: true,
            KNOWLEDGE_BASE: true,
            AUTO_SUMMARIZATION: true,
            SEMANTIC_SEARCH: true,
            CITATION_TRACKING: true,
            COLLABORATIVE_EDITING: true
        },
        SUPPORTED_FORMATS: [
            'pdf', 'docx', 'txt', 'md', 'html', 'json', 'csv', 'xlsx'
        ],
        MAX_DOCUMENT_SIZE: 25 * 1024 * 1024, // 25MB
        MAX_DOCUMENTS: 100
    },
    
    // Collections with GFE_ prefix
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
    }
};

/**
 * NotebookLM Command Center Widget Component
 */
const NotebookLMCommandCenter = ({ 
    adminMode = false,
    onSystemUpdate = () => {},
    onError = () => {},
    theme = 'dark'
}) => {
    // State Management
    const [activeView, setActiveView] = useState('dashboard');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authStatus, setAuthStatus] = useState({
        google: false,
        wix: false,
        backend: false
    });
    const [systemMetrics, setSystemMetrics] = useState({
        products: 0,
        quotes: 0,
        customers: 0,
        documents: 0,
        uptime: '99.8%',
        responseTime: '127ms'
    });
    const [documents, setDocuments] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [knowledgeBase, setKnowledgeBase] = useState([]);
    const [apiLibrary, setApiLibrary] = useState([]);
    const [commandHistory, setCommandHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    
    // Refs
    const chatInputRef = useRef(null);
    const terminalRef = useRef(null);
    const fileInputRef = useRef(null);
    
    // Initialize Component
    useEffect(() => {
        initializeCommandCenter();
        startSystemMonitoring();
        
        return () => {
            // Cleanup
            stopSystemMonitoring();
        };
    }, []);
    
    /**
     * Initialize Command Center
     */
    const initializeCommandCenter = useCallback(async () => {
        try {
            setIsLoading(true);
            
            // Check authentication status
            const authResult = await checkAuthenticationStatus();
            setAuthStatus(authResult);
            setIsAuthenticated(authResult.google && authResult.wix);
            
            // Load system metrics
            await loadSystemMetrics();
            
            // Load initial data
            await Promise.all([
                loadDocuments(),
                loadKnowledgeBase(),
                loadApiLibrary(),
                loadCommandHistory()
            ]);
            
            // Setup iframe communication
            setupIframeCommunication();
            
            showNotification('Command Center initialized successfully', 'success');
        } catch (error) {
            console.error('Command Center initialization failed:', error);
            showNotification('Initialization failed: ' + error.message, 'error');
            onError(error);
        } finally {
            setIsLoading(false);
        }
    }, [onError]);
    
    /**
     * Check Authentication Status
     */
    const checkAuthenticationStatus = useCallback(async () => {
        try {
            const [googleAuth, wixAuth, backendAuth] = await Promise.all([
                checkGoogleAuth(),
                checkWixAuth(),
                checkBackendAuth()
            ]);
            
            return {
                google: googleAuth,
                wix: wixAuth,
                backend: backendAuth
            };
        } catch (error) {
            console.error('Auth status check failed:', error);
            return { google: false, wix: false, backend: false };
        }
    }, []);
    
    /**
     * Check Google OAuth Status
     */
    const checkGoogleAuth = useCallback(async () => {
        try {
            const token = session.getItem('google_access_token');
            if (!token) return false;
            
            const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }, []);
    
    /**
     * Check Wix Headless Auth Status
     */
    const checkWixAuth = useCallback(async () => {
        try {
            const response = await fetch(`${ENHANCED_CONFIG.WIX.API_BASE_URL}/apps/v1/apps`, {
                headers: {
                    'Authorization': `Bearer ${ENHANCED_CONFIG.WIX.PRIMARY.ADMIN_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }, []);
    
    /**
     * Check Backend Auth Status
     */
    const checkBackendAuth = useCallback(async () => {
        try {
            const response = await fetch(`${ENHANCED_CONFIG.API_GATEWAY.BACKEND_URL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }, []);
    
    /**
     * Load System Metrics
     */
    const loadSystemMetrics = useCallback(async () => {
        try {
            const response = await fetch(`${ENHANCED_CONFIG.API_GATEWAY.BACKEND_URL}/api/metrics`);
            if (response.ok) {
                const metrics = await response.json();
                setSystemMetrics(metrics);
            }
        } catch (error) {
            console.error('Failed to load system metrics:', error);
        }
    }, []);
    
    /**
     * Load Documents
     */
    const loadDocuments = useCallback(async () => {
        try {
            const response = await fetch(`${ENHANCED_CONFIG.API_GATEWAY.BACKEND_URL}/api/documents`);
            if (response.ok) {
                const docs = await response.json();
                setDocuments(docs);
            }
        } catch (error) {
            console.error('Failed to load documents:', error);
        }
    }, []);
    
    /**
     * Load Knowledge Base
     */
    const loadKnowledgeBase = useCallback(async () => {
        try {
            const response = await fetch(`${ENHANCED_CONFIG.API_GATEWAY.BACKEND_URL}/api/knowledge-base`);
            if (response.ok) {
                const kb = await response.json();
                setKnowledgeBase(kb);
            }
        } catch (error) {
            console.error('Failed to load knowledge base:', error);
        }
    }, []);
    
    /**
     * Load API Library
     */
    const loadApiLibrary = useCallback(async () => {
        try {
            const response = await fetch(`${ENHANCED_CONFIG.API_GATEWAY.BACKEND_URL}/api/library`);
            if (response.ok) {
                const library = await response.json();
                setApiLibrary(library);
            }
        } catch (error) {
            console.error('Failed to load API library:', error);
        }
    }, []);
    
    /**
     * Load Command History
     */
    const loadCommandHistory = useCallback(async () => {
        try {
            const response = await fetch(`${ENHANCED_CONFIG.API_GATEWAY.BACKEND_URL}/api/commands/history`);
            if (response.ok) {
                const history = await response.json();
                setCommandHistory(history);
            }
        } catch (error) {
            console.error('Failed to load command history:', error);
        }
    }, []);
    
    /**
     * Handle File Upload
     */
    const handleFileUpload = useCallback(async (files) => {
        if (!files || files.length === 0) return;
        
        setIsLoading(true);
        
        try {
            for (const file of files) {
                if (file.size > ENHANCED_CONFIG.NOTEBOOK_LM.MAX_DOCUMENT_SIZE) {
                    showNotification(`File ${file.name} is too large. Max size: 25MB`, 'error');
                    continue;
                }
                
                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', 'document');
                formData.append('source', 'command-center');
                
                const response = await fetch(`${ENHANCED_CONFIG.API_GATEWAY.BACKEND_URL}/api/documents/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    setDocuments(prev => [...prev, result]);
                    showNotification(`Document ${file.name} uploaded successfully`, 'success');
                } else {
                    throw new Error(`Upload failed for ${file.name}`);
                }
            }
            
            // Refresh knowledge base
            await loadKnowledgeBase();
        } catch (error) {
            console.error('File upload failed:', error);
            showNotification('File upload failed: ' + error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    /**
     * Handle AI Chat
     */
    const handleAIChat = useCallback(async (message) => {
        if (!message.trim()) return;
        
        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: message,
            timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, userMessage]);
        
        try {
            const response = await fetch(`${ENHANCED_CONFIG.API_GATEWAY.BACKEND_URL}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.getItem('access_token')}`
                },
                body: JSON.stringify({
                    message: message,
                    context: 'command-center',
                    knowledgeBase: knowledgeBase.map(kb => kb.id),
                    documents: documents.map(doc => doc.id)
                })
            });
            
            if (response.ok) {
                const aiResponse = await response.json();
                const aiMessage = {
                    id: Date.now() + 1,
                    type: 'ai',
                    content: aiResponse.response,
                    citations: aiResponse.citations,
                    timestamp: new Date()
                };
                
                setChatMessages(prev => [...prev, aiMessage]);
            } else {
                throw new Error('AI chat request failed');
            }
        } catch (error) {
            console.error('AI chat failed:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'error',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
        }
    }, [knowledgeBase, documents]);
    
    /**
     * Execute Terminal Command
     */
    const executeCommand = useCallback(async (command) => {
        const commandEntry = {
            id: Date.now(),
            command: command,
            timestamp: new Date(),
            user: 'admin'
        };
        
        setCommandHistory(prev => [...prev, commandEntry]);
        
        try {
            const response = await fetch(`${ENHANCED_CONFIG.API_GATEWAY.BACKEND_URL}/api/commands/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.getItem('access_token')}`
                },
                body: JSON.stringify({
                    command: command,
                    context: 'command-center'
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                throw new Error('Command execution failed');
            }
        } catch (error) {
            console.error('Command execution failed:', error);
            return { success: false, error: error.message };
        }
    }, []);
    
    /**
     * Show Notification
     */
    const showNotification = useCallback((message, type = 'info') => {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        
        setNotifications(prev => [...prev, notification]);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
    }, []);
    
    /**
     * System Monitoring
     */
    let monitoringInterval;
    
    const startSystemMonitoring = useCallback(() => {
        monitoringInterval = setInterval(async () => {
            try {
                await loadSystemMetrics();
                const authResult = await checkAuthenticationStatus();
                setAuthStatus(authResult);
            } catch (error) {
                console.error('System monitoring error:', error);
            }
        }, 30000); // Every 30 seconds
    }, [loadSystemMetrics, checkAuthenticationStatus]);
    
    const stopSystemMonitoring = useCallback(() => {
        if (monitoringInterval) {
            clearInterval(monitoringInterval);
        }
    }, []);
    
    /**
     * Setup Iframe Communication
     */
    const setupIframeCommunication = useCallback(() => {
        window.addEventListener('message', (event) => {
            const { type, data } = event.data;
            
            switch (type) {
                case 'SYSTEM_UPDATE':
                    onSystemUpdate(data);
                    break;
                case 'RELOAD_DATA':
                    initializeCommandCenter();
                    break;
                case 'SHOW_NOTIFICATION':
                    showNotification(data.message, data.type);
                    break;
                default:
                    break;
            }
        });
    }, [onSystemUpdate, initializeCommandCenter, showNotification]);
    
    /**
     * Render Functions
     */
    const renderSidebar = () => (
        <div className="notebook-sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">🤖</div>
                    <div className="logo-text">
                        <div className="logo-title">NotebookLM</div>
                        <div className="logo-subtitle">Command Center</div>
                    </div>
                </div>
                <div className="auth-status">
                    <div className={`auth-indicator ${authStatus.google ? 'active' : 'inactive'}`}>
                        Google
                    </div>
                    <div className={`auth-indicator ${authStatus.wix ? 'active' : 'inactive'}`}>
                        Wix
                    </div>
                    <div className={`auth-indicator ${authStatus.backend ? 'active' : 'inactive'}`}>
                        Backend
                    </div>
                </div>
            </div>
            
            <div className="sidebar-navigation">
                <div className="nav-section">
                    <div className="nav-title">Core Features</div>
                    <button 
                        className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveView('dashboard')}
                    >
                        📊 Dashboard
                    </button>
                    <button 
                        className={`nav-item ${activeView === 'documents' ? 'active' : ''}`}
                        onClick={() => setActiveView('documents')}
                    >
                        📁 Documents
                    </button>
                    <button 
                        className={`nav-item ${activeView === 'chat' ? 'active' : ''}`}
                        onClick={() => setActiveView('chat')}
                    >
                        💬 AI Chat
                    </button>
                    <button 
                        className={`nav-item ${activeView === 'knowledge' ? 'active' : ''}`}
                        onClick={() => setActiveView('knowledge')}
                    >
                        🧠 Knowledge Base
                    </button>
                </div>
                
                <div className="nav-section">
                    <div className="nav-title">Administration</div>
                    <button 
                        className={`nav-item ${activeView === 'api-library' ? 'active' : ''}`}
                        onClick={() => setActiveView('api-library')}
                    >
                        🔗 API Library
                    </button>
                    <button 
                        className={`nav-item ${activeView === 'terminal' ? 'active' : ''}`}
                        onClick={() => setActiveView('terminal')}
                    >
                        💻 Terminal
                    </button>
                    <button 
                        className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveView('analytics')}
                    >
                        📈 Analytics
                    </button>
                    <button 
                        className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveView('settings')}
                    >
                        ⚙️ Settings
                    </button>
                </div>
            </div>
        </div>
    );
    
    const renderDashboard = () => (
        <div className="dashboard-view">
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">📄</div>
                    <div className="metric-value">{systemMetrics.documents}</div>
                    <div className="metric-label">Documents</div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">🏗️</div>
                    <div className="metric-value">{systemMetrics.products}</div>
                    <div className="metric-label">Products</div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">💰</div>
                    <div className="metric-value">{systemMetrics.quotes}</div>
                    <div className="metric-label">Quotes</div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon">👥</div>
                    <div className="metric-value">{systemMetrics.customers}</div>
                    <div className="metric-label">Customers</div>
                </div>
            </div>
            
            <div className="status-grid">
                <div className="status-card">
                    <h3>System Status</h3>
                    <div className="status-item">
                        <span>Uptime:</span>
                        <span className="status-value">{systemMetrics.uptime}</span>
                    </div>
                    <div className="status-item">
                        <span>Response Time:</span>
                        <span className="status-value">{systemMetrics.responseTime}</span>
                    </div>
                    <div className="status-item">
                        <span>Google OAuth:</span>
                        <span className={`status-badge ${authStatus.google ? 'active' : 'inactive'}`}>
                            {authStatus.google ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span>Wix Headless:</span>
                        <span className={`status-badge ${authStatus.wix ? 'active' : 'inactive'}`}>
                            {authStatus.wix ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                </div>
                
                <div className="status-card">
                    <h3>Recent Activity</h3>
                    <div className="activity-list">
                        {commandHistory.slice(-5).map(cmd => (
                            <div key={cmd.id} className="activity-item">
                                <span className="activity-time">
                                    {new Date(cmd.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="activity-command">{cmd.command}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
    
    const renderDocuments = () => (
        <div className="documents-view">
            <div className="documents-header">
                <h2>Document Library</h2>
                <div className="documents-actions">
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept=".pdf,.docx,.txt,.md,.html,.json,.csv,.xlsx"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        style={{ display: 'none' }}
                    />
                    <button 
                        className="btn btn-primary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        📁 Upload Documents
                    </button>
                </div>
            </div>
            
            <div className="documents-grid">
                {documents.map(doc => (
                    <div key={doc.id} className="document-card">
                        <div className="document-icon">
                            {getDocumentIcon(doc.type)}
                        </div>
                        <div className="document-info">
                            <div className="document-title">{doc.name}</div>
                            <div className="document-meta">
                                <span>{doc.size}</span>
                                <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="document-actions">
                            <button className="btn btn-sm">View</button>
                            <button className="btn btn-sm">Edit</button>
                            <button className="btn btn-sm btn-danger">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
    
    const renderChat = () => (
        <div className="chat-view">
            <div className="chat-header">
                <h2>AI Assistant</h2>
                <div className="chat-status">
                    <span className="status-indicator active"></span>
                    Online
                </div>
            </div>
            
            <div className="chat-messages">
                {chatMessages.map(msg => (
                    <div key={msg.id} className={`message ${msg.type}`}>
                        <div className="message-content">
                            {msg.content}
                        </div>
                        {msg.citations && (
                            <div className="message-citations">
                                <strong>Sources:</strong>
                                {msg.citations.map((citation, index) => (
                                    <span key={index} className="citation">
                                        {citation}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="chat-input">
                <input
                    ref={chatInputRef}
                    type="text"
                    placeholder="Ask me anything about your documents or systems..."
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleAIChat(e.target.value);
                            e.target.value = '';
                        }
                    }}
                />
                <button 
                    className="btn btn-primary"
                    onClick={() => {
                        if (chatInputRef.current?.value) {
                            handleAIChat(chatInputRef.current.value);
                            chatInputRef.current.value = '';
                        }
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
    
    const renderApiLibrary = () => (
        <div className="api-library-view">
            <div className="api-header">
                <h2>API Library</h2>
                <button className="btn btn-primary">
                    ➕ Add Endpoint
                </button>
            </div>
            
            <div className="api-grid">
                {Object.entries(ENHANCED_CONFIG.API_GATEWAY.ENDPOINTS).map(([name, endpoint]) => (
                    <div key={name} className="api-card">
                        <div className="api-method">GET</div>
                        <div className="api-endpoint">
                            <strong>{name}</strong>
                            <span>{endpoint}</span>
                        </div>
                        <div className="api-actions">
                            <button className="btn btn-sm">Test</button>
                            <button className="btn btn-sm">Docs</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
    
    const renderTerminal = () => (
        <div className="terminal-view">
            <div className="terminal-header">
                <h2>System Terminal</h2>
                <div className="terminal-controls">
                    <button className="btn btn-sm">Clear</button>
                    <button className="btn btn-sm">Export</button>
                </div>
            </div>
            
            <div className="terminal-output" ref={terminalRef}>
                <div className="terminal-welcome">
                    Welcome to NotebookLM Command Center Terminal
                    <br />
                    Type 'help' for available commands
                </div>
                
                {commandHistory.map(cmd => (
                    <div key={cmd.id} className="terminal-line">
                        <span className="terminal-prompt">gfe@notebook:~$</span>
                        <span className="terminal-command">{cmd.command}</span>
                        <span className="terminal-time">
                            {new Date(cmd.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
            </div>
            
            <div className="terminal-input">
                <span className="terminal-prompt">gfe@notebook:~$</span>
                <input
                    type="text"
                    placeholder="Enter command..."
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            executeCommand(e.target.value);
                            e.target.value = '';
                        }
                    }}
                />
            </div>
        </div>
    );
    
    const getDocumentIcon = (type) => {
        const icons = {
            'pdf': '📄',
            'docx': '📝',
            'txt': '📄',
            'md': '📋',
            'html': '🌐',
            'json': '📊',
            'csv': '📊',
            'xlsx': '📊'
        };
        return icons[type] || '📄';
    };
    
    const renderMainContent = () => {
        switch (activeView) {
            case 'dashboard':
                return renderDashboard();
            case 'documents':
                return renderDocuments();
            case 'chat':
                return renderChat();
            case 'api-library':
                return renderApiLibrary();
            case 'terminal':
                return renderTerminal();
            default:
                return renderDashboard();
        }
    };
    
    return (
        <div className={`notebook-command-center ${theme}`}>
            {renderSidebar()}
            
            <div className="main-content">
                <div className="content-header">
                    <h1>NotebookLM Command Center</h1>
                    <div className="header-actions">
                        <button 
                            className="btn"
                            onClick={() => initializeCommandCenter()}
                            disabled={isLoading}
                        >
                            {isLoading ? '🔄' : '🔄'} Refresh
                        </button>
                        <button className="btn btn-primary">
                            🚀 Deploy
                        </button>
                    </div>
                </div>
                
                <div className="content-body">
                    {renderMainContent()}
                </div>
            </div>
            
            {/* Notifications */}
            <div className="notifications">
                {notifications.map(notification => (
                    <div 
                        key={notification.id} 
                        className={`notification ${notification.type}`}
                    >
                        {notification.message}
                    </div>
                ))}
            </div>
            
            {/* Loading Overlay */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Processing...</div>
                </div>
            )}
        </div>
    );
};

export default NotebookLMCommandCenter;