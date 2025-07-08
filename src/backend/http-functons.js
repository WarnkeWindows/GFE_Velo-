/**
 * HTTP Functions - GFE Master API Endpoints
 * File: backend/http-functions.js
 *
 * Centralized API endpoints for the Good Faith Exteriors system.
 * This file routes all incoming HTTP requests from the frontend to the appropriate backend service.
 * It uses the unified constants and services defined across the project.
 */

import { ok, badRequest, serverError, notFound } from 'wix-http-functions';

// Import all necessary services and constants from your project files
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
    generateQuickEstimate
} from './services/pricing-service.web.js';

import {
    API_ENDPOINTS,
    ERROR_CODES,
    createResponse
} from './config/constants.web.js';

// =====================================================================
// API RESPONSE HELPER
// =====================================================================

/**
 * Creates a standardized API response with appropriate status codes.
 * @param {object} result - The result object from a service function.
 * @returns {WixHttpFunctionResponse} A formatted HTTP response.
 */
function createAPIResponse(result) {
    if (result.success) {
        return ok({ body: JSON.stringify(result) });
    }

    // Handle specific error codes with appropriate HTTP statuses
    switch (result.error?.code) {
        case ERROR_CODES.NOT_FOUND:
            return notFound({ body: JSON.stringify(result) });
        case ERROR_CODES.VALIDATION_FAILED:
        case ERROR_CODES.REQUIRED_FIELD_MISSING:
            return badRequest({ body: JSON.stringify(result) });
        default:
            return serverError({ body: JSON.stringify(result) });
    }
}


// =====================================================================
// LEAD & CRM ENDPOINTS
// =====================================================================

/**
 * Creates a new customer lead.
 * Endpoint: Matches API_ENDPOINTS.LEADS_CREATE
 */
export async function post_createLead(request) {
    const requestData = await request.body.json();
    const result = await createLead(requestData);
    return createAPIResponse(result);
}

/**
 * Retrieves a lead by ID.
 * Endpoint: Matches API_ENDPOINTS.LEADS_GET
 */
export async function get_getLead(request) {
    const leadId = request.path[0];
    const result = await getLead(leadId);
    return createAPIResponse(result);
}

// =====================================================================
// AI & ANALYSIS ENDPOINTS
// =====================================================================

/**
 * Analyzes an uploaded window image.
 * Endpoint: Matches API_ENDPOINTS.AI_ANALYZE_IMAGE
 */
export async function post_analyzeImage(request) {
    const { imageData, customerId, metadata } = await request.body.json();
    const result = await analyzeWindowImage(imageData, customerId, metadata || {});
    return createAPIResponse(result);
}

/**
 * Processes a message using the AI chat service.
 * Endpoint: Matches API_ENDPOINTS.AI_CHAT
 */
export async function post_aiChat(request) {
    const { message, conversationHistory, customerId, context } = await request.body.json();
    const result = await handleAIChat(message, conversationHistory || [], customerId, context || {});
    return createAPIResponse(result);
}

/**
 * Generates product recommendations from analysis data.
 */
export async function post_generateRecommendations(request) {
    const { analysisData, customerPreferences } = await request.body.json();
    const result = await generateProductRecommendations(analysisData, customerPreferences || {});
    return createAPIResponse(result);
}


// =====================================================================
// PRICING & PRODUCT ENDPOINTS
// =====================================================================

/**
 * Calculates a detailed pricing estimate.
 * Endpoint: Matches API_ENDPOINTS.PRICING_CALCULATE
 */
export async function post_calculatePricing(request) {
    const estimateData = await request.body.json();
    const result = await calculatePricingEstimate(estimateData);
    return createAPIResponse(result);
}

/**
 * Retrieves the full product catalog.
 * Endpoint: Matches API_ENDPOINTS.PRODUCTS_CATALOG
 */
export async function get_productCatalog(request) {
    const filters = request.query; // Assumes filters are passed as query params
    const result = await getProductCatalog(filters);
    return createAPIResponse(result);
}

/**
 * Retrieves all window brands.
 * Endpoint: Matches API_ENDPOINTS.PRODUCTS_BRANDS
 */
export async function get_windowBrands(request) {
    const result = await getWindowBrands();
    return createAPIResponse(result);
}


// =====================================================================
// QUOTE MANAGEMENT ENDPOINTS
// =====================================================================

/**
 * Creates a new quote in the database.
 * Endpoint: Matches API_ENDPOINTS.QUOTES_CREATE
 */
export async function post_createQuote(request) {
    const quoteData = await request.body.json();
    const result = await createQuote(quoteData);
    return createAPIResponse(result);
}

/**
 * Updates the status of an existing quote.
 * Endpoint: Matches API_ENDPOINTS.QUOTES_UPDATE_STATUS
 */
export async function put_updateQuoteStatus(request) {
    const quoteId = request.path[0];
    const { status } = await request.body.json();
    const result = await updateQuoteStatus(quoteId, status);
    return createAPIResponse(result);
}

/**
 * System health check endpoint.
 */
export async function get_health(request) {
    const healthStatus = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: ["wix-data", "anthropic-ai", "pricing"]
    };
    return ok({ body: JSON.stringify(createResponse(true, healthStatus, "System is operational.")) });
}