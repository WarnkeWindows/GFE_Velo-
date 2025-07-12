import React, { useState, useEffect } from 'react';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import Error from '../shared/components/Error';
import Loading from '../shared/components/Loading';
import { useWindowData, usePriceCalculation } from '../shared/hooks/useWindowData';
import { windowService } from '../shared/services/window-service';
import { analyticsService } from '../shared/services/analytics-service';
import { apiService } from '../shared/services/api-service';
import './WindowEstimator.css';

// Comprehensive API Configuration
const API_CONFIG = {
  wix: {
    siteId: '5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4',
    backendUrl: 'https://gfe-backend-837326026335.us-central1.run.app'
  },
  ai: {
    providers: ['anthropic', 'openai', 'google'],
    defaultProvider: 'anthropic'
  },
  features: {
    aiEstimation: true,
    visionAnalysis: true,
    smartRecommendations: true,
    errorTracking: true
  }
};

const WindowEstimator = () => {
  const [windowType, setWindowType] = useState(null);
  const [windowBrand, setWindowBrand] = useState(null);
  const [dimensions, setDimensions] = useState({
    width: '',
    height: ''
  });
  const [options, setOptions] = useState([]);
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track page view
  useEffect(() => {
    analyticsService.trackPageView('Window Estimator');
  }, []);

  // Fetch window data
  const { products, loading: productsLoading, error: productsError } = useWindowData();
  const { price, calculatePrice, loading: priceLoading } = usePriceCalculation();

  // Handle window type selection
  const handleWindowType = (type) => {
    setWindowType(type);
    setWindowBrand(null);
    setDimensions({ width: '', height: '' });
    setOptions([]);
    
    // Track window type selection
    analyticsService.trackEvent('Window Type Selected', { type });
  };

  // Handle window brand selection
  const handleWindowBrand = (brand) => {
    setWindowBrand(brand);
    setDimensions({ width: '', height: '' });
    setOptions([]);
    
    // Track window brand selection
    analyticsService.trackEvent('Window Brand Selected', { brand });
  };

  // Handle dimension change
  const handleDimensionChange = (field, value) => {
    setDimensions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle option selection
  const handleOptionChange = (option) => {
    setOptions(prev => 
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  // Enhanced AI-powered price calculation
  const calculateWindowPrice = async () => {
    if (!windowType || !windowBrand || !dimensions.width || !dimensions.height) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Traditional calculation
      const priceData = await calculatePrice({
        windowType,
        windowBrand,
        dimensions,
        options
      });

      // AI-Enhanced estimation if enabled
      let aiEstimation = null;
      if (API_CONFIG.features.aiEstimation) {
        try {
          aiEstimation = await apiService.callBackendFunction('processAIEstimation', {
            windows: [{
              type: windowType,
              brand: windowBrand,
              width: dimensions.width,
              height: dimensions.height,
              options: options
            }],
            projectType: 'replacement'
          });
        } catch (aiError) {
          console.warn('AI estimation failed, using traditional calculation:', aiError);
          // Send error to Sentry
          await apiService.callBackendFunction('logErrorToSentry', aiError, {
            component: 'WindowEstimator',
            feature: 'AI Estimation'
          });
        }
      }

      // Get AI-powered smart recommendations
      let smartRecommendations = [];
      if (API_CONFIG.features.smartRecommendations) {
        try {
          const recommendationPrompt = `Based on ${windowType} ${windowBrand} window with dimensions ${dimensions.width}x${dimensions.height}, provide 3 smart recommendations for energy efficiency and cost savings.`;
          
          const aiResponse = await apiService.callBackendFunction('processAIChatRequest', 
            recommendationPrompt, 
            API_CONFIG.ai.defaultProvider,
            { maxTokens: 512 }
          );
          
          smartRecommendations = aiResponse?.content || [];
        } catch (recError) {
          console.warn('Smart recommendations failed:', recError);
        }
      }

      // Combine results
      const finalQuoteData = {
        ...priceData,
        aiEstimation: aiEstimation,
        smartRecommendations: smartRecommendations,
        enhancedBy: 'AI'
      };

      setQuoteData(finalQuoteData);

      if (priceData && priceData.total) {
        // Enhanced tracking with AI data
        analyticsService.trackEvent('Price Calculated', {
          type: windowType,
          brand: windowBrand,
          price: priceData.total,
          aiEnhanced: !!aiEstimation,
          hasRecommendations: smartRecommendations.length > 0
        });
      }
    } catch (error) {
      setError(error.message);
      
      // Enhanced error tracking
      await apiService.callBackendFunction('logErrorToSentry', error, {
        component: 'WindowEstimator',
        windowType: windowType,
        windowBrand: windowBrand,
        dimensions: dimensions
      });
      
      analyticsService.trackError({
        error: error.message,
        context: 'AI-Enhanced Price Calculation'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create quote
  const createQuote = async () => {
    if (!windowType || !windowBrand || !dimensions.width || !dimensions.height) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const quote = await windowService.createQuote({
        windowType,
        windowBrand,
        dimensions,
        options,
        price: price?.total
      });

      if (quote.success) {
        setQuoteData(quote.data);
        // Track quote creation
        analyticsService.trackEvent('Quote Created', {
          quoteId: quote.data.id,
          total: quote.data.total
        });
      }
    } catch (error) {
      setError(error.message);
      analyticsService.trackError({
        error: error.message,
        context: 'Quote Creation'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading size="large" />;
  }

  if (error) {
    return <Error message={error} onClose={() => setError(null)} />;
  }

  return (
    <ErrorBoundary componentName="WindowEstimator">
      <div className="window-estimator">
        <h1>Window Estimator</h1>
        
        {/* Window Type Selection */}
        <div className="window-type-selector">
          <h2>Choose Window Type</h2>
          <div className="window-type-grid">
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => handleWindowType(product.type)}
                className={`window-type-btn ${windowType === product.type ? 'selected' : ''}`}
              >
                <img src={product.image} alt={product.name} />
                <span>{product.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Window Brand Selection */}
        {windowType && (
          <div className="window-brand-selector">
            <h2>Choose Brand</h2>
            <div className="window-brand-grid">
              {products
                .filter(p => p.type === windowType)
                .map(product => (
                  <button
                    key={product.brand}
                    onClick={() => handleWindowBrand(product.brand)}
                    className={`window-brand-btn ${windowBrand === product.brand ? 'selected' : ''}`}
                  >
                    <img src={product.logo} alt={product.brand} />
                    <span>{product.brand}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Dimensions Input */}
        {windowBrand && (
          <div className="dimensions-input">
            <h2>Enter Dimensions</h2>
            <div className="dimension-fields">
              <div className="dimension-field">
                <label>Width (inches)</label>
                <input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  placeholder="Enter width"
                  required
                />
              </div>
              <div className="dimension-field">
                <label>Height (inches)</label>
                <input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  placeholder="Enter height"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Options Selection */}
        {dimensions.width && dimensions.height && (
          <div className="options-selector">
            <h2>Select Options</h2>
            <div className="options-grid">
              {products[0]?.options.map(option => (
                <label key={option} className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={options.includes(option)}
                    onChange={() => handleOptionChange(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Calculation */}
        {options.length > 0 && (
          <div className="price-calculation">
            <button
              onClick={calculateWindowPrice}
              disabled={priceLoading}
              className="calculate-btn"
            >
              {priceLoading ? <Loading size="small" /> : 'Calculate Price'}
            </button>

            {price && (
              <div className="price-display">
                <h3>Estimated Price: ${price.total.toFixed(2)}</h3>
                <div className="price-breakdown">
                  <div>Base Price: ${price.breakdown.basePrice.toFixed(2)}</div>
                  {price.breakdown.options.map(opt => (
                    <div key={opt.name}>{opt.name}: ${opt.price.toFixed(2)}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Quote */}
        {price && (
          <div className="create-quote">
            <button
              onClick={createQuote}
              disabled={loading}
              className="quote-btn"
            >
              {loading ? <Loading size="small" /> : 'Create Quote'}
            </button>

            {quoteData && (
              <div className="quote-success">
                <h3>Quote Created Successfully!</h3>
                <p>Quote ID: {quoteData.id}</p>
                <p>Total: ${quoteData.total.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default WindowEstimator;
