#!/bin/bash

# GFE Parameter Manager Integration Setup
# Configures Google Cloud Parameter Manager with Wix Velo integration

set -e

PROJECT_ID="good-faith-exteriors"
PROJECT_NUMBER="837326026335"
REGION="us-central1"

echo "🔧 Setting up GFE Parameter Manager Integration..."

# Enable required APIs
echo "📋 Enabling required Google Cloud APIs..."
gcloud services enable parametermanager.googleapis.com \
  secretmanager.googleapis.com \
  run.googleapis.com \
  apigateway.googleapis.com \
  servicecontrol.googleapis.com \
  servicemanagement.googleapis.com \
  --project=$PROJECT_ID

# Create parameter hierarchy for GFE
echo "🏗️ Creating parameter hierarchy..."

# API Configuration Parameters
gcloud alpha parameter-manager parameters create gfe-api-gateway-url \
  --location=global \
  --value="https://gfe-api-gateway-aonuaov3.uc.gateway.dev" \
  --description="GFE API Gateway URL" \
  --project=$PROJECT_ID || echo "Parameter already exists"

gcloud alpha parameter-manager parameters create gfe-backend-url \
  --location=global \
  --value="https://gfe-backend-837326026335.us-central1.run.app" \
  --description="GFE Cloud Run Backend URL" \
  --project=$PROJECT_ID || echo "Parameter already exists"

# Wix Integration Parameters
gcloud alpha parameter-manager parameters create wix-site-id \
  --location=global \
  --value="5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4" \
  --description="Wix Site ID for GFE" \
  --project=$PROJECT_ID || echo "Parameter already exists"

gcloud alpha parameter-manager parameters create wix-meta-site-id \
  --location=global \
  --value="5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4" \
  --description="Wix Meta Site ID" \
  --project=$PROJECT_ID || echo "Parameter already exists"

# Cloud Storage Configuration
gcloud alpha parameter-manager parameters create gfe-storage-buckets \
  --location=global \
  --value='{"ai_training":"gfe-ai-training-data","widgets":"goodfaithexteriors-widgets","static_pages":"gfe-static-pages","image_analysis":"image-analysis-library","vision_input":"vision-input-837326026335"}' \
  --description="GFE Cloud Storage Bucket Configuration" \
  --project=$PROJECT_ID || echo "Parameter already exists"

# OpenAI Integration Parameters
gcloud alpha parameter-manager parameters create openai-organization-id \
  --location=global \
  --value="org-Mt6x8qFqX3PAYoLV4tkZUhjP" \
  --description="OpenAI Organization ID" \
  --project=$PROJECT_ID || echo "Parameter already exists"

gcloud alpha parameter-manager parameters create openai-assistants \
  --location=global \
  --value='{"window_advisor":"asst_jZBK7NjoaNPzAfPVUwQ2FYfL","code_agent":"asst_kWjokMdTpFsQJeLIiyhKOdz9"}' \
  --description="OpenAI Assistant IDs" \
  --project=$PROJECT_ID || echo "Parameter already exists"

gcloud alpha parameter-manager parameters create openai-vector-stores \
  --location=global \
  --value='{"window_products":"vs_686f1c83071881919b7f7441fb193903","code_bank":"vs_686f32440a5c8191a4cba9c72ca5e33b"}' \
  --description="OpenAI Vector Store IDs" \
  --project=$PROJECT_ID || echo "Parameter already exists"

# Regional Parameters (us-central1)
echo "🌍 Creating regional parameters..."

gcloud alpha parameter-manager parameters create gfe-regional-config \
  --location=$REGION \
  --value='{"cache_ttl":300,"max_retries":3,"timeout_ms":30000}' \
  --description="Regional configuration for GFE services" \
  --project=$PROJECT_ID || echo "Parameter already exists"

gcloud alpha parameter-manager parameters create service-endpoints \
  --location=$REGION \
  --value='{"mcp_server":"gfe-mcp-server-837326026335.us-central1.run.app","backend":"gfe-backend-837326026335.us-central1.run.app","gateway":"gfe-api-gateway-aonuaov3.uc.gateway.dev"}' \
  --description="Service endpoint configuration" \
  --project=$PROJECT_ID || echo "Parameter already exists"

# IAM Permissions for Parameter Manager
echo "🔐 Setting up IAM permissions..."

# Grant Parameter Manager access to Cloud Run service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/parametermanager.parameterViewer" || echo "IAM binding already exists"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" || echo "IAM binding already exists"

# Create Parameter Manager integration script
echo "📝 Creating parameter integration utilities..."

cat > parameter-integration.js << 'EOF'
const { ParameterManagerServiceClient } = require('@google-cloud/parameter-manager');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

class GFEParameterManager {
  constructor(projectId = 'good-faith-exteriors') {
    this.projectId = projectId;
    this.parameterClient = new ParameterManagerServiceClient();
    this.secretClient = new SecretManagerServiceClient();
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes
  }

  async getParameter(name, location = 'global') {
    const cacheKey = `${location}:${name}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached.value;
    }

    try {
      const parameterPath = this.parameterClient.parameterPath(
        this.projectId, 
        location, 
        name
      );
      
      const [parameter] = await this.parameterClient.getParameter({
        name: parameterPath
      });
      
      const value = parameter.value;
      this.cache.set(cacheKey, {
        value,
        timestamp: Date.now()
      });
      
      return value;
    } catch (error) {
      console.error(`Failed to get parameter ${name}:`, error);
      
      // Fallback to Secret Manager
      try {
        const secretPath = this.secretClient.secretVersionPath(
          this.projectId,
          name,
          'latest'
        );
        
        const [version] = await this.secretClient.accessSecretVersion({
          name: secretPath
        });
        
        return version.payload.data.toString();
      } catch (secretError) {
        console.error(`Failed to get secret ${name}:`, secretError);
        
        // Final fallback to environment variables
        return process.env[name.toUpperCase().replace(/-/g, '_')];
      }
    }
  }

  async updateParameter(name, value, location = 'global') {
    try {
      const parameterPath = this.parameterClient.parameterPath(
        this.projectId,
        location,
        name
      );
      
      await this.parameterClient.updateParameter({
        parameter: {
          name: parameterPath,
          value: value
        }
      });
      
      // Clear cache for this parameter
      this.cache.delete(`${location}:${name}`);
      
      return true;
    } catch (error) {
      console.error(`Failed to update parameter ${name}:`, error);
      return false;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = { GFEParameterManager };
EOF

echo "✅ GFE Parameter Manager Integration setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy the updated Cloud Run service with parameter integration"
echo "2. Update API Gateway configuration"
echo "3. Test parameter retrieval and caching"
echo ""
echo "🔧 Available parameters:"
echo "- gfe-api-gateway-url"
echo "- gfe-backend-url" 
echo "- wix-site-id"
echo "- gfe-storage-buckets"
echo "- openai-organization-id"
echo "- openai-assistants"
echo "- openai-vector-stores"
echo "- gfe-regional-config"
echo "- service-endpoints"
echo ""
echo "📍 Use: gcloud alpha parameter-manager parameters list --location=global --project=$PROJECT_ID"