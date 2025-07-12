#!/bin/bash

# Complete GFE System Deployment with Parameter Manager Integration
# Deploys API Gateway, Cloud Run backend, and configures all services

set -e

PROJECT_ID="good-faith-exteriors"
PROJECT_NUMBER="837326026335"
REGION="us-central1"
API_ID="gfe-api-gateway"
GATEWAY_ID="gfe-gateway"

echo "🚀 Deploying Complete GFE System with Parameter Manager..."

# 1. Setup Parameter Manager first
echo "📋 Setting up Parameter Manager..."
chmod +x gfe-parameter-manager-setup.sh
./gfe-parameter-manager-setup.sh

# 2. Create package.json for Cloud Run service
echo "📦 Creating package.json for Cloud Run..."
cat > package.json << 'EOF'
{
  "name": "gfe-backend-service",
  "version": "1.0.0",
  "description": "GFE Cloud Run Backend with Parameter Manager",
  "main": "cloud-run-app.js",
  "scripts": {
    "start": "node cloud-run-app.js",
    "dev": "nodemon cloud-run-app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "@google-cloud/parameter-manager": "^1.0.0",
    "@google-cloud/secret-manager": "^4.2.2"
  },
  "engines": {
    "node": ">=18"
  }
}
EOF

# 3. Create Dockerfile
echo "🐳 Creating Dockerfile..."
cat > Dockerfile << 'EOF'
FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
EOF

# 4. Deploy Cloud Run service
echo "☁️ Deploying Cloud Run service..."
gcloud run deploy gfe-backend \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="PROJECT_ID=$PROJECT_ID,PROJECT_NUMBER=$PROJECT_NUMBER" \
  --memory=1Gi \
  --cpu=1 \
  --concurrency=100 \
  --max-instances=10 \
  --project=$PROJECT_ID

# Get the Cloud Run service URL
BACKEND_URL=$(gcloud run services describe gfe-backend \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(status.url)")

echo "✅ Cloud Run deployed at: $BACKEND_URL"

# 5. Update API Gateway configuration with actual backend URL
echo "🔧 Updating API Gateway configuration..."
sed -i "s|https://gfe-backend-837326026335.us-central1.run.app|$BACKEND_URL|g" api-gateway-config.yaml

# 6. Create API Gateway
echo "🌐 Creating API Gateway..."

# Create API
gcloud api-gateway apis create $API_ID \
  --project=$PROJECT_ID || echo "API already exists"

# Create API config
gcloud api-gateway api-configs create gfe-config-$(date +%Y%m%d-%H%M%S) \
  --api=$API_ID \
  --openapi-spec=api-gateway-config.yaml \
  --project=$PROJECT_ID

# Get the latest config ID
CONFIG_ID=$(gcloud api-gateway api-configs list \
  --api=$API_ID \
  --project=$PROJECT_ID \
  --format="value(name)" \
  --sort-by="~createTime" \
  --limit=1)

# Create or update gateway
gcloud api-gateway gateways create $GATEWAY_ID \
  --api=$API_ID \
  --api-config=$CONFIG_ID \
  --location=$REGION \
  --project=$PROJECT_ID || \
gcloud api-gateway gateways update $GATEWAY_ID \
  --api=$API_ID \
  --api-config=$CONFIG_ID \
  --location=$REGION \
  --project=$PROJECT_ID

# Get gateway URL
GATEWAY_URL=$(gcloud api-gateway gateways describe $GATEWAY_ID \
  --location=$REGION \
  --project=$PROJECT_ID \
  --format="value(defaultHostname)")

# 7. Update Wix backend service with correct URLs
echo "🔄 Updating Wix backend integration..."
cat > src/backend/enhanced-velo-integration.jsw << EOF
/**
 * Enhanced Velo Integration Service with Parameter Manager
 * File: backend/enhanced-velo-integration.jsw
 */

import wixData from 'wix-data';
import wixSecrets from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';

// Configuration using Parameter Manager hierarchy
const ENHANCED_GFE_CONFIG = {
    API_GATEWAY_URL: 'https://$GATEWAY_URL',
    BACKEND_URL: '$BACKEND_URL',
    PROJECT_ID: '$PROJECT_ID',
    PROJECT_NUMBER: '$PROJECT_NUMBER',
    
    STORAGE_BUCKETS: {
        AI_TRAINING: 'gfe-ai-training-data',
        WIDGETS: 'goodfaithexteriors-widgets',
        STATIC_PAGES: 'gfe-static-pages',
        IMAGE_ANALYSIS: 'image-analysis-library',
        VISION_INPUT: 'vision-input-837326026335'
    },
    
    OPENAI_CONFIG: {
        ORGANIZATION_ID: 'org-Mt6x8qFqX3PAYoLV4tkZUhjP',
        ASSISTANTS: {
            WINDOW_ADVISOR: 'asst_jZBK7NjoaNPzAfPVUwQ2FYfL',
            CODE_AGENT: 'asst_kWjokMdTpFsQJeLIiyhKOdz9'
        },
        VECTOR_STORES: {
            WINDOW_PRODUCTS: 'vs_686f1c83071881919b7f7441fb193903',
            CODE_BANK: 'vs_686f32440a5c8191a4cba9c72ca5e33b'
        }
    }
};

// Enhanced API client with authentication
async function callEnhancedAPI(endpoint, data = {}, method = 'POST') {
    try {
        const apiKey = await wixSecrets.getSecret('GFE_API_KEY');
        const url = \`\${ENHANCED_GFE_CONFIG.API_GATEWAY_URL}\${endpoint}\`;
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: method !== 'GET' ? JSON.stringify(data) : undefined
        });
        
        if (!response.ok) {
            throw new Error(\`API call failed: \${response.status} \${response.statusText}\`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Enhanced API Error:', error);
        throw error;
    }
}

// Health check function
export async function checkSystemHealth() {
    try {
        const response = await fetch(\`\${ENHANCED_GFE_CONFIG.API_GATEWAY_URL}/health\`);
        return await response.json();
    } catch (error) {
        console.error('Health Check Error:', error);
        return { status: 'unhealthy', error: error.message };
    }
}

// Window estimation with enhanced features
export async function getWindowEstimate(imageUrl, propertyDetails = {}) {
    return await callEnhancedAPI('/api/claude/admin-assistant', {
        prompt: \`Analyze window estimation for property with image: \${imageUrl}\`,
        options: { propertyDetails, analysisType: 'window_estimation' }
    });
}

// System analysis
export async function analyzeSystem(component, analysisType = 'performance') {
    return await callEnhancedAPI('/api/claude/analyze-system', {
        component,
        analysisType
    });
}

// Configuration generation
export async function generateConfiguration(configType, requirements = {}) {
    return await callEnhancedAPI('/api/claude/generate-config', {
        configType,
        requirements
    });
}

// Image upload with enhanced processing
export async function uploadImage(imageData, analysisOptions = {}) {
    return await callEnhancedAPI('/api/claude/admin-assistant', {
        prompt: 'Process uploaded image for window analysis',
        options: { imageData, analysisOptions }
    });
}

// Troubleshooting assistance
export async function troubleshootIssue(issue, context = {}) {
    return await callEnhancedAPI('/api/claude/troubleshoot', {
        issue,
        context
    });
}

// Code review functionality
export async function reviewCode(code, reviewType = 'security') {
    return await callEnhancedAPI('/api/claude/review-code', {
        code,
        reviewType
    });
}

// Configuration retrieval from Parameter Manager
export async function getSystemConfiguration() {
    return ENHANCED_GFE_CONFIG;
}
EOF

echo "✅ Complete GFE System Deployment Finished!"
echo ""
echo "🔗 Service URLs:"
echo "  API Gateway: https://$GATEWAY_URL"
echo "  Cloud Run Backend: $BACKEND_URL"
echo "  Health Check: https://$GATEWAY_URL/health"
echo ""
echo "🧪 Test Commands:"
echo "  curl https://$GATEWAY_URL/health"
echo "  curl -H \"X-API-Key: YOUR_KEY\" -X POST https://$GATEWAY_URL/api/claude/admin-assistant -d '{\"prompt\":\"test\"}'"
echo ""
echo "📋 Next Steps:"
echo "1. Update Wix Secrets with GFE_API_KEY"
echo "2. Test all endpoints"
echo "3. Deploy Wix Velo code changes"
echo "4. Monitor system health"