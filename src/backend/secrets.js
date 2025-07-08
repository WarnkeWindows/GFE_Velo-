// =====================================================================
// GOOD FAITH EXTERIORS - SECURE VELO BACKEND MODULE
// Secrets Manager for API Keys and Secure Configuration
// =====================================================================

import { getSecret } from 'wix-secrets-backend';

/**
 * Secure secrets manager for Good Faith Exteriors
 * Handles API keys, database connections, and sensitive configuration
 */
export class GFESecretsManager {
    constructor() {
        this.secrets = new Map();
        this.initialized = false;
    }

    /**
     * Initialize all required secrets
     */
    async initialize() {
        try {
            console.log('🔐 Initializing GFE Secrets Manager...');
            
            // Load all required secrets
            await this.loadSecrets();
            
            this.initialized = true;
            console.log('✅ GFE Secrets Manager initialized successfully');
            
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to initialize secrets manager:', error);
            throw new Error('Secrets initialization failed');
        }
    }

    /**
     * Load all secrets from Wix Secrets Manager
     */
    async loadSecrets() {
        const secretKeys = [
            'ANTHROPIC_API_KEY',
            'OPENAI_API_KEY', 
            'GFE_DATABASE_URL',
            'GFE_EMAIL_API_KEY',
            'GFE_TWILIO_SID',
            'GFE_TWILIO_TOKEN',
            'GFE_STRIPE_SECRET_KEY',
            'GFE_GOOGLE_MAPS_API_KEY',
            'GFE_ENCRYPTION_KEY',
            'GFE_JWT_SECRET'
        ];

        for (const key of secretKeys) {
            try {
                const secret = await getSecret(key);
                if (secret) {
                    this.secrets.set(key, secret);
                    console.log(`✅ Loaded secret: ${key}`);
                } else {
                    console.warn(`⚠️ Secret not found: ${key}`);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to load secret ${key}:`, error.message);
            }
        }
    }

    /**
     * Get a secret value securely
     */
    getSecret(key) {
        if (!this.initialized) {
            throw new Error('Secrets manager not initialized');
        }
        
        const secret = this.secrets.get(key);
        if (!secret) {
            throw new Error(`Secret not found: ${key}`);
        }
        
        return secret;
    }

    /**
     * Get Anthropic API configuration
     */
    getAnthropicConfig() {
        return {
            apiKey: this.getSecret('ANTHROPIC_API_KEY'),
            baseURL: 'https://api.anthropic.com',
            model: 'claude-3-sonnet-20240229',
            maxTokens: 4000,
            temperature: 0.7
        };
    }

    /**
     * Get OpenAI API configuration
     */
    getOpenAIConfig() {
        return {
            apiKey: this.getSecret('OPENAI_API_KEY'),
            baseURL: 'https://api.openai.com/v1',
            model: 'gpt-4-vision-preview',
            maxTokens: 4000,
            temperature: 0.7
        };
    }

    /**
     * Get database configuration
     */
    getDatabaseConfig() {
        return {
            url: this.getSecret('GFE_DATABASE_URL'),
            ssl: true,
            connectionTimeout: 30000
        };
    }

    /**
     * Get email service configuration
     */
    getEmailConfig() {
        return {
            apiKey: this.getSecret('GFE_EMAIL_API_KEY'),
            fromEmail: 'quotes@goodfaithexteriors.com',
            fromName: 'Good Faith Exteriors'
        };
    }

    /**
     * Get Twilio configuration for SMS
     */
    getTwilioConfig() {
        return {
            accountSid: this.getSecret('GFE_TWILIO_SID'),
            authToken: this.getSecret('GFE_TWILIO_TOKEN'),
            fromNumber: '+16514168669'
        };
    }

    /**
     * Get Stripe configuration for payments
     */
    getStripeConfig() {
        return {
            secretKey: this.getSecret('GFE_STRIPE_SECRET_KEY'),
            publishableKey: 'pk_live_...' // This can be public
        };
    }

    /**
     * Get Google Maps API configuration
     */
    getGoogleMapsConfig() {
        return {
            apiKey: this.getSecret('GFE_GOOGLE_MAPS_API_KEY'),
            baseURL: 'https://maps.googleapis.com/maps/api'
        };
    }

    /**
     * Get encryption configuration
     */
    getEncryptionConfig() {
        return {
            key: this.getSecret('GFE_ENCRYPTION_KEY'),
            algorithm: 'aes-256-gcm'
        };
    }

    /**
     * Get JWT configuration
     */
    getJWTConfig() {
        return {
            secret: this.getSecret('GFE_JWT_SECRET'),
            expiresIn: '24h',
            issuer: 'goodfaithexteriors.com'
        };
    }

    /**
     * Validate API key format
     */
    validateAPIKey(key, type = 'general') {
        if (!key || typeof key !== 'string') {
            return false;
        }

        switch (type) {
            case 'anthropic':
                return key.startsWith('sk-ant-');
            case 'openai':
                return key.startsWith('sk-');
            case 'stripe':
                return key.startsWith('sk_live_') || key.startsWith('sk_test_');
            default:
                return key.length > 10;
        }
    }

    /**
     * Check if all required secrets are loaded
     */
    checkSecretHealth() {
        const requiredSecrets = [
            'ANTHROPIC_API_KEY',
            'GFE_DATABASE_URL',
            'GFE_EMAIL_API_KEY'
        ];

        const health = {
            status: 'healthy',
            secrets: {},
            missingSecrets: []
        };

        for (const secret of requiredSecrets) {
            if (this.secrets.has(secret)) {
                health.secrets[secret] = 'loaded';
            } else {
                health.secrets[secret] = 'missing';
                health.missingSecrets.push(secret);
                health.status = 'unhealthy';
            }
        }

        return health;
    }

    /**
     * Rotate API keys (for security maintenance)
     */
    async rotateSecret(secretKey, newValue) {
        try {
            // In a real implementation, this would update the secret in Wix Secrets Manager
            // For now, we'll update our local cache
            this.secrets.set(secretKey, newValue);
            
            console.log(`🔄 Rotated secret: ${secretKey}`);
            return { success: true, message: 'Secret rotated successfully' };
        } catch (error) {
            console.error(`❌ Failed to rotate secret ${secretKey}:`, error);
            throw new Error('Secret rotation failed');
        }
    }

    /**
     * Get sanitized configuration for frontend (no secrets)
     */
    getFrontendConfig() {
        return {
            apiEndpoints: {
                ai: '/api/ai-analysis',
                pricing: '/api/pricing-calculation',
                quotes: '/api/quotes',
                email: '/api/send-email'
            },
            features: {
                aiAnalysis: this.secrets.has('ANTHROPIC_API_KEY'),
                emailQuotes: this.secrets.has('GFE_EMAIL_API_KEY'),
                smsNotifications: this.secrets.has('GFE_TWILIO_SID'),
                payments: this.secrets.has('GFE_STRIPE_SECRET_KEY')
            },
            limits: {
                maxImageSize: 10 * 1024 * 1024, // 10MB
                maxQuoteItems: 50,
                rateLimit: 100 // requests per hour
            }
        };
    }
}

// Create singleton instance
const secretsManager = new GFESecretsManager();

/**
 * Initialize secrets manager (call this in your Velo backend initialization)
 */
export async function initializeSecrets() {
    return await secretsManager.initialize();
}

/**
 * Get secrets manager instance
 */
export function getSecretsManager() {
    return secretsManager;
}

/**
 * Quick access functions for common secrets
 */
export function getAnthropicKey() {
    return secretsManager.getSecret('ANTHROPIC_API_KEY');
}

export function getOpenAIKey() {
    return secretsManager.getSecret('OPENAI_API_KEY');
}

export function getDatabaseURL() {
    return secretsManager.getSecret('GFE_DATABASE_URL');
}

export function getEmailAPIKey() {
    return secretsManager.getSecret('GFE_EMAIL_API_KEY');
}

/**
 * Security utilities
 */
export function sanitizeForLogging(data) {
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = ['apiKey', 'password', 'token', 'secret', 'key'];
    
    function recursiveSanitize(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                recursiveSanitize(obj[key]);
            } else if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                obj[key] = '[REDACTED]';
            }
        }
    }
    
    recursiveSanitize(sanitized);
    return sanitized;
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
    constructor() {
        this.requests = new Map();
    }

    isAllowed(identifier, limit = 100, windowMs = 3600000) { // 100 requests per hour
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!this.requests.has(identifier)) {
            this.requests.set(identifier, []);
        }
        
        const userRequests = this.requests.get(identifier);
        
        // Remove old requests outside the window
        const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
        
        if (validRequests.length >= limit) {
            return false;
        }
        
        // Add current request
        validRequests.push(now);
        this.requests.set(identifier, validRequests);
        
        return true;
    }
}

// Export rate limiter instance
export const rateLimiter = new RateLimiter();

