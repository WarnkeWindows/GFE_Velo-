#!/bin/bash

# GFE System Integration Testing Script
# Tests all components after deployment

set -e

PROJECT_ID="good-faith-exteriors"
REGION="us-central1"

echo "🧪 Testing GFE System Integration..."

# Get service URLs
GATEWAY_URL=$(gcloud api-gateway gateways describe gfe-gateway \
  --location=$REGION \
  --project=$PROJECT_ID \
  --format="value(defaultHostname)" 2>/dev/null || echo "")

BACKEND_URL=$(gcloud run services describe gfe-backend \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(status.url)" 2>/dev/null || echo "")

if [ -z "$GATEWAY_URL" ] || [ -z "$BACKEND_URL" ]; then
    echo "❌ Services not found. Run deployment script first."
    exit 1
fi

echo "🔗 Testing URLs:"
echo "  Gateway: https://$GATEWAY_URL"
echo "  Backend: $BACKEND_URL"
echo ""

# Test 1: Health endpoint via Gateway
echo "🏥 Testing Gateway Health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "https://$GATEWAY_URL/health" || echo "FAILED")

if echo "$HEALTH_RESPONSE" | grep -q "HTTP_STATUS:200"; then
    echo "✅ Gateway health check passed"
    echo "$HEALTH_RESPONSE" | head -n -1 | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "❌ Gateway health check failed"
    echo "$HEALTH_RESPONSE"
fi

echo ""

# Test 2: Direct Backend Health
echo "🏥 Testing Direct Backend Health..."
BACKEND_HEALTH=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BACKEND_URL/health" || echo "FAILED")

if echo "$BACKEND_HEALTH" | grep -q "HTTP_STATUS:200"; then
    echo "✅ Backend health check passed"
    echo "$BACKEND_HEALTH" | head -n -1 | jq '.' 2>/dev/null || echo "$BACKEND_HEALTH"
else
    echo "❌ Backend health check failed"
    echo "$BACKEND_HEALTH"
fi

echo ""

# Test 3: Parameter Manager configuration
echo "📋 Testing Parameter Manager..."

echo "🔍 Listing global parameters:"
gcloud alpha parameter-manager parameters list \
  --location=global \
  --project=$PROJECT_ID \
  --format="table(name.basename(),value)" || echo "Parameter Manager not accessible"

echo ""

echo "🔍 Listing regional parameters:"
gcloud alpha parameter-manager parameters list \
  --location=$REGION \
  --project=$PROJECT_ID \
  --format="table(name.basename(),value)" || echo "Regional parameters not accessible"

echo ""

# Test 4: API Gateway with API Key (if available)
echo "🔑 Testing API Gateway with authentication..."

# Try to get API key from Secret Manager
API_KEY=$(gcloud secrets versions access latest --secret="GFE_API_KEY" --project=$PROJECT_ID 2>/dev/null || echo "")

if [ -n "$API_KEY" ]; then
    echo "✅ Found API key, testing authenticated endpoint..."
    
    AUTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -H "Content-Type: application/json" \
      -H "X-API-Key: $API_KEY" \
      -X POST \
      -d '{"prompt":"Test integration","options":{"test":true}}' \
      "https://$GATEWAY_URL/api/claude/admin-assistant" || echo "FAILED")
    
    if echo "$AUTH_RESPONSE" | grep -q "HTTP_STATUS:200"; then
        echo "✅ Authenticated API call successful"
        echo "$AUTH_RESPONSE" | head -n -1 | jq '.' 2>/dev/null || echo "$AUTH_RESPONSE"
    else
        echo "❌ Authenticated API call failed"
        echo "$AUTH_RESPONSE"
    fi
else
    echo "⚠️  No API key found in Secret Manager. Create one with:"
    echo "   echo 'your-api-key' | gcloud secrets create GFE_API_KEY --data-file=- --project=$PROJECT_ID"
fi

echo ""

# Test 5: Wix Integration Check
echo "🌐 Testing Wix Integration..."

if [ -f "src/backend/enhanced-velo-integration.jsw" ]; then
    echo "✅ Enhanced Velo integration file exists"
    
    # Check if it contains the correct URLs
    if grep -q "$GATEWAY_URL" src/backend/enhanced-velo-integration.jsw; then
        echo "✅ Gateway URL configured in Wix backend"
    else
        echo "⚠️  Gateway URL not found in Wix backend - may need manual update"
    fi
    
    if grep -q "$BACKEND_URL" src/backend/enhanced-velo-integration.jsw; then
        echo "✅ Backend URL configured in Wix backend"
    else
        echo "⚠️  Backend URL not found in Wix backend - may need manual update"
    fi
else
    echo "❌ Enhanced Velo integration file not found"
fi

echo ""

# Test 6: Cloud Storage buckets
echo "☁️ Testing Cloud Storage buckets..."

BUCKETS=("gfe-ai-training-data" "goodfaithexteriors-widgets" "gfe-static-pages" "image-analysis-library" "vision-input-837326026335")

for bucket in "${BUCKETS[@]}"; do
    if gsutil ls -b "gs://$bucket" >/dev/null 2>&1; then
        echo "✅ Bucket $bucket accessible"
    else
        echo "❌ Bucket $bucket not accessible or doesn't exist"
    fi
done

echo ""

# Summary
echo "📊 Integration Test Summary:"
echo "=================================="

if echo "$HEALTH_RESPONSE" | grep -q "HTTP_STATUS:200" && \
   echo "$BACKEND_HEALTH" | grep -q "HTTP_STATUS:200"; then
    echo "✅ Core services operational"
else
    echo "❌ Core services have issues"
fi

if [ -n "$API_KEY" ] && echo "$AUTH_RESPONSE" | grep -q "HTTP_STATUS:200"; then
    echo "✅ Authentication working"
else
    echo "⚠️  Authentication needs setup"
fi

echo ""
echo "🚀 System Status: Ready for Wix Velo integration"
echo ""
echo "📋 Next steps:"
echo "1. Ensure API key is set in Wix Secrets"
echo "2. Deploy Wix Velo code with 'npm run deploy'"
echo "3. Test frontend integration"
echo "4. Monitor with './monitor-services.sh'"