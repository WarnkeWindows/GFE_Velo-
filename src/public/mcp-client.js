/**
 * MCP Client for Good Faith Exteriors
 * Connects frontend to MCP services
 */

const MCP_CONFIG = {
    services: {
        claude: 'https://gfe-claude-mcp-837326026335.us-central1.run.app',
        backend: 'https://gfe-backend-837326026335.us-central1.run.app',
        gateway: 'https://gfe-api-gateway-aonuaov3.uc.gateway.dev'
    },
    endpoints: {
        health: '/health',
        chat: '/api/claude/chat',
        analysis: '/api/claude/analyze',
        estimation: '/api/estimation',
        admin: '/api/claude/admin-assistant'
    }
};

export class MCPClient {
    constructor() {
        this.apiKey = null;
        this.sessionId = this.generateSessionId();
    }

    generateSessionId() {
        return 'mcp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async callMCPService(endpoint, data = {}, options = {}) {
        const url = `${MCP_CONFIG.services.claude}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': this.sessionId,
                    'X-Source': 'wix-frontend',
                    ...(this.apiKey && { 'X-API-Key': this.apiKey })
                },
                body: JSON.stringify({
                    ...data,
                    session_id: this.sessionId,
                    timestamp: new Date().toISOString(),
                    ...options
                })
            });

            if (!response.ok) {
                throw new Error(`MCP Service error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('MCP Client Error:', error);
            throw error;
        }
    }

    async chatWithClaude(message, context = {}) {
        return await this.callMCPService(MCP_CONFIG.endpoints.chat, {
            message,
            context: {
                page: 'wix-frontend',
                user_context: context,
                mcp_session: this.sessionId
            }
        });
    }

    async getWindowEstimation(windowData, propertyInfo = {}) {
        return await this.callMCPService(MCP_CONFIG.endpoints.estimation, {
            windows: windowData,
            property: propertyInfo,
            analysis_type: 'window_estimation'
        });
    }

    async analyzeImage(imageData, analysisType = 'window_analysis') {
        return await this.callMCPService(MCP_CONFIG.endpoints.analysis, {
            image_data: imageData,
            analysis_type: analysisType,
            mcp_context: 'image_analysis'
        });
    }

    async adminAssistant(prompt, adminContext = {}) {
        return await this.callMCPService(MCP_CONFIG.endpoints.admin, {
            prompt,
            context: {
                admin_session: true,
                mcp_admin: true,
                ...adminContext
            }
        });
    }

    async healthCheck() {
        try {
            const response = await fetch(`${MCP_CONFIG.services.claude}${MCP_CONFIG.endpoints.health}`);
            return await response.json();
        } catch (error) {
            console.error('MCP Health Check failed:', error);
            return { status: 'error', error: error.message };
        }
    }

    setApiKey(key) {
        this.apiKey = key;
    }
}

// Export singleton instance
export const mcpClient = new MCPClient();