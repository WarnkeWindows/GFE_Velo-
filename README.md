# Good Faith Exteriors - Main Production Site

This is the main production Wix site for Good Faith Exteriors, featuring advanced AI-powered window estimation, integrated backend services, and comprehensive customer management.

## 🏗️ Architecture

- **Frontend**: Wix Velo JavaScript
- **Backend**: Google Cloud Run (Python Flask)
- **API Gateway**: Google Cloud API Gateway
- **Database**: Google Cloud Firestore
- **AI Services**: Claude AI (Anthropic)

## 🔧 Backend Integration

The site is fully integrated with our Google Cloud backend services:

- **API Gateway**: `https://gfe-api-gateway-aonuaov3.uc.gateway.dev`
- **Backend Service**: `https://gfe-backend-837326026335.us-central1.run.app`
- **Site ID**: `5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4`

## 📦 Features

### Core Services
- ✅ AI-powered window estimation
- ✅ Product catalog management
- ✅ Lead generation and tracking
- ✅ Quote generation and management
- ✅ Customer portal integration
- ✅ Real-time chat support

### Backend Services
- ✅ Google Cloud Firestore integration
- ✅ Claude AI integration for estimations
- ✅ Automated quote generation
- ✅ CRM data synchronization
- ✅ Analytics and reporting

## 🚀 Deployment

### Prerequisites
1. Wix CLI installed: `npm install -g @wix/cli`
2. Authenticated with Wix: `wix login`
3. Site connected to repository

### Deploy to Production
```bash
# Install dependencies
npm install

# Build and deploy
npm run build
npm run deploy
```

### Environment Configuration
Required secrets in Wix Secrets Manager:
- `GFE_API_KEY`: Backend API authentication key
- `WEBHOOK_SECRET`: Webhook signature verification
- `GOOGLE_CLOUD_PROJECT`: Google Cloud project ID

## 📱 Site Structure

```
src/
├── backend/
│   ├── gfe-service.jsw          # Main backend service integration
│   └── http-functions.js        # HTTP endpoints and webhooks
├── pages/
│   ├── masterPage.js           # Global configurations
│   ├── Home.js                 # Homepage functionality
│   ├── Good Faith Estimator.js # AI estimation page
│   └── Window Products.js      # Product catalog page
└── public/
    └── README.md              # Public assets documentation
```

## 🔐 Security

- All API requests use authentication headers
- Webhook signatures are verified
- Environment variables stored in Wix Secrets Manager
- CORS properly configured for API Gateway

## 📊 Monitoring

- Health checks available at `/health`
- Error logging to Google Cloud Logging
- Analytics tracking integrated
- Performance monitoring via Sentry

## 🤝 Support

For technical support or deployment issues:
- Email: goodfaithwindows@gmail.com
- Documentation: See individual page READMEs

## 📝 Version History

- **v2.0.0**: Full backend integration with Google Cloud services
- **v1.0.0**: Initial Wix Velo implementation

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>