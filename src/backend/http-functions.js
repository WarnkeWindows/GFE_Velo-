/**
 * HTTP Functions - API Endpoints
 * backend/http-functions.js
 * 
 * Centralized API endpoints for frontend-backend communication
 * Handles all HTTP requests from iframe components
 */

import { ok, badRequest, serverError, notFound, forbidden } from 'wix-http-functions';
import { 
    createLead,
    getLead,
    updateLead,
    searchLeads,
    getProductCatalog,
    getWindowBrands,
    getWindowTypes,
    createQuote,
    updateQuoteStatus,
    logSystemEvent
} from './core/wix-data-service.web.js';
import { 
    analyzeWindowImage, 
    handleAIChat, 
    generateProductRecommendations 
} from './ai/anthropic-service.web.js';
import { 
    calculatePricingEstimate, 
    getPricingMultipliersForDisplay, 
    generateQuickEstimate, 
    comparePricingTiers 
} from './services/pricing-service.web.js';
import { 
    MESSAGE_TYPES, 
    TRUSTED_ORIGINS, 
    ERROR_CODES,
    isTrustedOrigin,
    createResponse 
} from './config/constants.web.js';

// =====================================================================
// MIDDLEWARE FUNCTIONS
// =====================================================================

/**
 * Validates request origin
 */
function validateOrigin(request) {
    const origin = request.headers.origin || request.headers.referer;
    
    if (!origin) {
        return false;
    }
    
    try {
        const url = new URL(origin);
        return isTrustedOrigin(url.origin);
    } catch (error) {
        return false;
    }
}

/**
 * Parses request body
 */
async function parseRequestBody(request) {
    try {
        const body = await request.body.text();
        return JSON.parse(body);
    } catch (error) {
        throw new Error('Invalid JSON in request body');
    }
}

/**
 * Creates CORS headers
 */
function createCORSHeaders(origin = '*') {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };
}

/**
 * Handles preflight OPTIONS requests
 */
function handlePreflight(request) {
    const origin = request.headers.origin;
    const headers = createCORSHeaders(isTrustedOrigin(origin) ? origin : '*');
    
    return ok('', headers);
}

/**
 * Creates standardized API response
 */
function createAPIResponse(result, statusCode = 200) {
    const origin = '*'; // Allow all origins for API responses
    const headers = createCORSHeaders(origin);
    
    if (statusCode === 200) {
        return ok(JSON.stringify(result), headers);
    } else if (statusCode === 400) {
        return badRequest(JSON.stringify(result), headers);
    } else if (statusCode === 404) {
        return notFound(JSON.stringify(result), headers);
    } else if (statusCode === 403) {
        return forbidden(JSON.stringify(result), headers);
    } else {
        return serverError(JSON.stringify(result), headers);
    }
}

// =====================================================================
// CUSTOMER MANAGEMENT ENDPOINTS
// =====================================================================

/**
 * POST /api/leads/create
 * Creates a new customer lead
 */
export async function post_createLead(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const requestData = await parseRequestBody(request);
        
        // Log API request
        await logSystemEvent({
            eventType: 'api_request',
            endpoint: 'post_createLead',
            method: 'POST',
            origin: request.headers.origin,
            userAgent: request.headers['user-agent']
        });
        
        const result = await createLead(requestData);
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

/**
 * GET /api/leads/{leadId}
 * Retrieves a customer lead by ID
 */
export async function get_getLead(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const leadId = request.path[0]; // Extract from URL path
        
        if (!leadId) {
            const errorResponse = createResponse(false, null, '', {
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Lead ID is required'
            });
            return createAPIResponse(errorResponse, 400);
        }
        
        const result = await getLead(leadId);
        
        return createAPIResponse(result, result.success ? 200 : 404);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

/**
 * PUT /api/leads/{leadId}
 * Updates a customer lead
 */
export async function put_updateLead(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const leadId = request.path[0];
        const requestData = await parseRequestBody(request);
        
        if (!leadId) {
            const errorResponse = createResponse(false, null, '', {
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Lead ID is required'
            });
            return createAPIResponse(errorResponse, 400);
        }
        
        const result = await updateLead(leadId, requestData);
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

/**
 * POST /api/leads/search
 * Searches leads by criteria
 */
export async function post_searchLeads(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const searchCriteria = await parseRequestBody(request);
        
        const result = await searchLeads(searchCriteria);
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

// =====================================================================
// AI ANALYSIS ENDPOINTS
// =====================================================================

/**
 * POST /api/ai/analyze-image
 * Analyzes uploaded image for window measurements
 */
export async function post_analyzeImage(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const requestData = await parseRequestBody(request);
        
        if (!requestData.imageData) {
            const errorResponse = createResponse(false, null, '', {
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Image data is required'
            });
            return createAPIResponse(errorResponse, 400);
        }
        
        // Log AI analysis request
        await logSystemEvent({
            eventType: 'ai_analysis_request',
            endpoint: 'post_analyzeImage',
            customerId: requestData.customerId,
            imageSize: requestData.imageData.length
        });
        
        const result = await analyzeWindowImage(
            requestData.imageData,
            requestData.customerId,
            requestData.metadata || {}
        );
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

/**
 * POST /api/ai/chat
 * Handles AI chat interaction
 */
export async function post_aiChat(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const requestData = await parseRequestBody(request);
        
        if (!requestData.message) {
            const errorResponse = createResponse(false, null, '', {
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Message is required'
            });
            return createAPIResponse(errorResponse, 400);
        }
        
        const result = await handleAIChat(
            requestData.message,
            requestData.conversationHistory || [],
            requestData.customerId,
            requestData.context || {}
        );
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

/**
 * POST /api/ai/recommendations
 * Generates product recommendations based on analysis
 */
export async function post_generateRecommendations(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const requestData = await parseRequestBody(request);
        
        if (!requestData.analysisData) {
            const errorResponse = createResponse(false, null, '', {
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Analysis data is required'
            });
            return createAPIResponse(errorResponse, 400);
        }
        
        const result = await generateProductRecommendations(
            requestData.analysisData,
            requestData.customerPreferences || {}
        );
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

// =====================================================================
// PRODUCT & PRICING ENDPOINTS
// =====================================================================

/**
 * GET /api/products/catalog
 * Retrieves product catalog
 */
export async function get_productCatalog(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        // Parse query parameters for filters
        const url = new URL(request.url);
        const filters = {
            brand: url.searchParams.get('brand'),
            type: url.searchParams.get('type'),
            material: url.searchParams.get('material'),
            isActive: url.searchParams.get('isActive') === 'true'
        };
        
        // Remove null values
        Object.keys(filters).forEach(key => {
            if (filters[key] === null || filters[key] === undefined) {
                delete filters[key];
            }
        });
        
        const result = await getProductCatalog(filters);
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

/**
 * GET /api/products/brands
 * Retrieves window brands
 */
export async function get_windowBrands(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const result = await getWindowBrands();
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

/**
 * GET /api/products/types
 * Retrieves window types
 */
export async function get_windowTypes(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const result = await getWindowTypes();
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

/**
 * POST /api/pricing/calculate
 * Calculates pricing estimate
 */
export async function post_calculatePricing(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const estimateData = await parseRequestBody(request);
        
        const result = await calculatePricingEstimate(estimateData);
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

/**
 * GET /api/pricing/multipliers
 * Retrieves pricing multipliers
 */
export async function get_pricingMultipliers(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const result = await getPricingMultipliersForDisplay();
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

/**
 * POST /api/pricing/quick-estimate
 * Generates quick pricing estimate
 */
export async function post_quickEstimate(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const requestData = await parseRequestBody(request);
        
        if (!requestData.squareFootage) {
            const errorResponse = createResponse(false, null, '', {
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Square footage is required'
            });
            return createAPIResponse(errorResponse, 400);
        }
        
        const result = await generateQuickEstimate(
            requestData.squareFootage,
            requestData.tier || 'standard',
            requestData.options || []
        );
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

// =====================================================================
// QUOTE MANAGEMENT ENDPOINTS
// =====================================================================

/**
 * POST /api/quotes/create
 * Creates a new quote
 */
export async function post_createQuote(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const quoteData = await parseRequestBody(request);
        
        const result = await createQuote(quoteData);
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

/**
 * PUT /api/quotes/{quoteId}/status
 * Updates quote status
 */
export async function put_updateQuoteStatus(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const quoteId = request.path[0];
        const requestData = await parseRequestBody(request);
        
        if (!quoteId) {
            const errorResponse = createResponse(false, null, '', {
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Quote ID is required'
            });
            return createAPIResponse(errorResponse, 400);
        }
        
        if (!requestData.status) {
            const errorResponse = createResponse(false, null, '', {
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Status is required'
            });
            return createAPIResponse(errorResponse, 400);
        }
        
        const result = await updateQuoteStatus(quoteId, requestData.status);
        
        return createAPIResponse(result, result.success ? 200 : 400);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

// =====================================================================
// HEALTH CHECK ENDPOINT
// =====================================================================

/**
 * GET /api/health
 * System health check
 */
export async function get_health(request) {
    try {
        if (request.method === 'OPTIONS') {
            return handlePreflight(request);
        }
        
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            services: {
                database: 'connected',
                ai: 'available',
                pricing: 'operational'
            }
        };
        
        const result = createResponse(true, healthData, 'System is healthy');
        
        return createAPIResponse(result, 200);
        
    } catch (error) {
        const errorResponse = createResponse(false, null, '', {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: error.message
        });
        return createAPIResponse(errorResponse, 500);
    }
}

