import { ok, badRequest, serverError } from 'wix-http-functions';
import {
    analyzeWindowImage,
    generateQuoteExplanation,
} from './ai/anthropic-service.web';
import { calculateWindowQuote } from './core/pricing-service.web';
import {
    createOrUpdateCustomer,
    createQuoteItem,
    storeAIAnalysis,
    logSystemEvent,
    getPricingConfiguration,
} from './core/wix-data-service.web';

function successResponse(data, extra = {}) {
    return ok({
        success: true,
        ...data,
        ...extra,
        timestamp: new Date().toISOString()
    });
}

function handleError(error, endpoint) {
    console.error(`Error in ${endpoint}:`, error);
    logSystemEvent({
        eventType: 'api_error',
        level: 'error',
        message: `API endpoint error: ${endpoint}`,
        details: {
            error: error.message,
            endpoint,
            stack: error.stack
        }
    }).catch(logError => {
        console.error('Failed to log error:', logError);
    });
    return serverError({
        success: false,
        error: error.message || 'Internal server error',
        endpoint,
        timestamp: new Date().toISOString()
    });
}

function validateRequestBody(body, requiredFields = []) {
    if (!body) {
        throw new Error('Request body is required');
    }
    for (const field of requiredFields) {
        if (!body[field]) {
            throw new Error(`Required field '${field}' is missing`);
        }
    }
    return true;
}

export async function post_ai_analysis(request) {
    try {
        const body = await request.body.json();
        validateRequestBody(body, ['windowData']);

        const { windowData, customerPreferences = {}, existingWindows = [] } = body;
        const sessionId = windowData.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const analysisResult = await analyzeWindowImage(windowData.imageData, {
            analysisType: 'detailed',
            includeRecommendations: true,
            customerContext: customerPreferences
        });

        if (!analysisResult.success) {
            throw new Error(analysisResult.error);
        }

        const storeResult = await storeAIAnalysis({
            sessionName: sessionId,
            userEmail: customerPreferences?.email || '',
            userPhone: customerPreferences?.phone || '',
            projectType: 'Window Replacement',
            sessionNotes: `AI Analysis - detailed`,
            windowImage: 'base64_image_data_placeholder',
            measuredWidth: analysisResult.analysis.estimatedWidth || 'N/A',
            measuredHeight: analysisResult.analysis.estimatedHeight || 'N/A',
            confidencePercent: analysisResult.analysis.confidence || 'N/A',
            detectedType: analysisResult.analysis.windowType || 'Unknown',
            aiAnalysisData: analysisResult.analysis,
            processingMetadata: {
                model: analysisResult.usage?.model || 'claude-3-5-sonnet',
                tokens: analysisResult.usage?.total_tokens || 0,
                timestamp: analysisResult.timestamp
            }
        });

        return successResponse({
            aiAnalysis: analysisResult.analysis,
            confidence: analysisResult.analysis.confidence,
            stored: storeResult.success,
            analysisId: storeResult.id,
            sessionId: sessionId
        });

    } catch (error) {
        return handleError(error, 'post_ai_analysis');
    }
}

export async function post_pricing_calculator(request) {
    try {
        const body = await request.body.json();
        validateRequestBody(body, ['windows']);

        const { windows, customerInfo = {}, sessionId } = body;

        const configResult = await getPricingConfiguration();
        const config = configResult.config;

        const quoteResult = await calculateWindowQuote(windows, config);
        if (!quoteResult.success) {
            throw new Error(quoteResult.error);
        }

        if (customerInfo.email) {
            const customerResult = await createOrUpdateCustomer(customerInfo);
            if (customerResult.success) {
                for (const window of quoteResult.quote.windows) {
                    await createQuoteItem({
                        customerEmail: customerInfo.email,
                        sessionId,
                        ...window
                    });
                }
            }
        }

        return successResponse({
            quote: quoteResult.quote,
            sessionId,
            calculation: quoteResult.calculation
        });

    } catch (error) {
        return handleError(error, 'post_pricing_calculator');
    }
}

export async function post_quote_generator(request) {
    try {
        const body = await request.body.json();
        validateRequestBody(body, ['quoteData']);

        const { quoteData, customerProfile = {}, sessionId } = body;

        const explanationResult = await generateQuoteExplanation(quoteData, customerProfile);
        if (!explanationResult.success) {
            throw new Error(explanationResult.error);
        }

        return successResponse({
            explanation: explanationResult.explanation,
            sessionId,
            usage: explanationResult.usage
        });

    } catch (error) {
        return handleError(error, 'post_quote_generator');
    }
}

export async function post_email_service(request) {
    try {
        const body = await request.body.json();
        validateRequestBody(body, ['quoteId', 'customerEmail', 'customerName']);

        const { quoteId, customerEmail, customerName, quoteData } = body;

        console.log(`Simulating email send for Quote ID: ${quoteId} to ${customerEmail}`);
        console.log('Customer Name:', customerName);
        await logSystemEvent({
            eventType: 'email_send_attempt',
            message: `Simulated email sent for quote ${quoteId}`,
            details: { quoteId, customerEmail, customerName, status: 'simulated_success' }
        });

        return successResponse({
            message: `Simulated email sent successfully to ${customerEmail}`,
            status: 'simulated_success',
            quoteId: quoteId
        });

    } catch (error) {
        return handleError(error, 'post_email_service');
    }
}
import { getWindowBrands, getCompanyInfo, processClaudeChat } from 'backend/master-gfe-integration.jsw';

export async function fetchWindowBrands() {
    try {
        const brands = await getWindowBrands();
        return brands;
    } catch (error) {
        console.error('Error fetching window brands:', error);
        throw new Error('Failed to fetch window brands');
    }
}

export async function fetchCompanyInfo() {
    try {
        const companyInfo = await getCompanyInfo();
        return companyInfo;
    } catch (error) {
        console.error('Error fetching company info:', error);
        throw new Error('Failed to fetch company info');
    }
}

export async function handleClaudeChat(message) {
    try {
        const response = await processClaudeChat(message);
        return response;
    } catch (error) {
        console.error('Error processing Claude chat:', error);
        throw new Error('Failed to process chat message');
    }
} 