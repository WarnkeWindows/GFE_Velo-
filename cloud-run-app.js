const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      backend: 'operational',
      database: 'operational',
      parameterManager: 'operational'
    },
    version: '1.0.0'
  });
});

// API key middleware for protected endpoints
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.GFE_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Admin assistant endpoint
app.post('/api/claude/admin-assistant', validateApiKey, async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    // Mock response for now - replace with actual Claude integration
    const response = {
      response: `Admin Assistant Response to: ${prompt}`,
      options: options,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Admin Assistant Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// System analysis endpoint
app.post('/api/claude/analyze-system', validateApiKey, async (req, res) => {
  try {
    const { component, analysisType = 'performance' } = req.body;
    
    const response = {
      component,
      analysisType,
      results: `Analysis of ${component} for ${analysisType}`,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('System Analysis Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Configuration generation endpoint
app.post('/api/claude/generate-config', validateApiKey, async (req, res) => {
  try {
    const { configType, requirements = {} } = req.body;
    
    const response = {
      configType,
      requirements,
      config: `Generated configuration for ${configType}`,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Configuration Generation Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Troubleshooting endpoint
app.post('/api/claude/troubleshoot', validateApiKey, async (req, res) => {
  try {
    const { issue, context = {} } = req.body;
    
    const response = {
      issue,
      context,
      solution: `Troubleshooting solution for: ${issue}`,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Troubleshooting Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Code review endpoint
app.post('/api/claude/review-code', validateApiKey, async (req, res) => {
  try {
    const { code, reviewType = 'security' } = req.body;
    
    const response = {
      code: code.substring(0, 100) + '...',
      reviewType,
      review: `Code review for ${reviewType}: Code looks good`,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Code Review Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`GFE Backend running on port ${PORT}`);
});