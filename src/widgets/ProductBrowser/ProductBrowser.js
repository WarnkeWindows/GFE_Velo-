import React, { useState, useEffect } from 'react';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import Error from '../shared/components/Error';
import Loading from '../shared/components/Loading';
import { useWindowData } from '../shared/hooks/useWindowData';
import { windowService } from '../shared/services/window-service';
import { analyticsService } from '../shared/services/analytics-service';
import { apiService } from '../shared/services/api-service';
import './ProductBrowser.css';

const ProductBrowser = () => {
  const [filters, setFilters] = useState({
    type: '',
    brand: '',
    priceRange: [0, 10000],
    sortBy: 'name'
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [systemConfig, setSystemConfig] = useState(null);

  // Track page view and initialize system
  useEffect(() => {
    analyticsService.trackPageView('Product Browser');
    initializeSystem();
  }, []);

  // Initialize system configuration
  const initializeSystem = async () => {
    try {
      const config = await apiService.getSystemConfig();
      setSystemConfig(config);
    } catch (error) {
      console.warn('Failed to load system config:', error);
    }
  };

  // Fetch products with filters
  const { products, loading: productsLoading, error: productsError } = useWindowData(filters);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));

    // Track filter change
    analyticsService.trackEvent('Product Filter Changed', {
      field,
      value
    });
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    setSelectedProducts(prev => 
      prev.includes(product)
        ? prev.filter(p => p !== product)
        : [...prev, product]
    );

    // Track product selection
    analyticsService.trackEvent('Product Selected', {
      productId: product.id,
      selected: !selectedProducts.includes(product)
    });
  };

  // Handle wishlist addition with AI recommendations
  const addToWishlist = async (product) => {
    try {
      setLoading(true);
      setError(null);

      // Add to local wishlist
      setWishlist(prev => [...prev, product]);

      // Submit to backend for persistence
      await apiService.callBackendFunction('addToWishlist', {
        productId: product.id,
        productData: product
      });

      // Get AI recommendations if enabled
      if (systemConfig?.features?.aiEnabled) {
        try {
          const recommendationPrompt = `Based on the product "${product.name}" (${product.type} ${product.brand}), suggest 3 complementary products that would work well together.`;
          const recommendations = await apiService.processAIChat(recommendationPrompt, 'anthropic', {
            maxTokens: 512
          });
          
          if (recommendations?.content) {
            setAiRecommendations(prev => [...prev, ...recommendations.content]);
          }
        } catch (aiError) {
          console.warn('AI recommendations failed:', aiError);
        }
      }

      // Track wishlist addition
      analyticsService.trackEvent('Product Added to Wishlist', {
        productId: product.id,
        productName: product.name
      });
    } catch (error) {
      setError(error.message);
      
      // Enhanced error tracking
      await apiService.logError(error, {
        component: 'ProductBrowser',
        action: 'addToWishlist',
        productId: product.id
      });
      
      analyticsService.trackError({
        error: error.message,
        context: 'Wishlist Addition'
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced quote request with AI pricing
  const requestQuote = async (selected) => {
    try {
      setLoading(true);
      setError(null);

      // Get AI-enhanced quote
      const aiQuote = await apiService.getAIQuote({
        products: selected,
        source: 'Product Browser',
        requestType: 'multi-product'
      });

      // Create traditional quote as fallback
      const quote = await windowService.createQuote({
        products: selected,
        source: 'Product Browser'
      });

      if (quote.success || aiQuote.success) {
        // Track quote request
        analyticsService.trackEvent('Quote Requested', {
          quoteId: quote.data?.id || aiQuote.data?.id,
          productCount: selected.length,
          aiEnhanced: !!aiQuote.success
        });

        // Submit lead automatically
        await apiService.submitLead({
          source: 'Product Browser Quote',
          products: selected,
          quoteId: quote.data?.id || aiQuote.data?.id,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      setError(error.message);
      
      // Enhanced error tracking
      await apiService.logError(error, {
        component: 'ProductBrowser',
        action: 'requestQuote',
        productCount: selected.length
      });
      
      analyticsService.trackError({
        error: error.message,
        context: 'Quote Request'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || productsLoading) {
    return <Loading size="large" />;
  }

  if (error || productsError) {
    return <Error message={error || productsError} onClose={() => setError(null)} />;
  }

  return (
    <ErrorBoundary componentName="ProductBrowser">
      <div className="product-browser">
        <h1>Product Browser</h1>

        {/* Filters Section */}
        <div className="filters-section">
          <h2>Filters</h2>
          <div className="filters-grid">
            <div className="filter-item">
              <label>Window Type:</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                {products.map(p => (
                  <option key={p.type} value={p.type}>
                    {p.type}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Brand:</label>
              <select
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
              >
                <option value="">All Brands</option>
                {products.map(p => (
                  <option key={p.brand} value={p.brand}>
                    {p.brand}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Price Range:</label>
              <div className="price-range">
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => handleFilterChange('priceRange', [
                    parseInt(e.target.value),
                    filters.priceRange[1]
                  ])}
                  placeholder="Min"
                />
                <span>to</span>
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => handleFilterChange('priceRange', [
                    filters.priceRange[0],
                    parseInt(e.target.value)
                  ])}
                  placeholder="Max"
                />
              </div>
            </div>

            <div className="filter-item">
              <label>Sort By:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {products.map(product => (
            <div
              key={product.id}
              className={`product-card ${selectedProducts.includes(product) ? 'selected' : ''}`}
            >
              <img src={product.image} alt={product.name} />
              <h3>{product.name}</h3>
              <p>Brand: {product.brand}</p>
              <p>Type: {product.type}</p>
              <p>Price: ${product.price.toFixed(2)}</p>
              <div className="product-actions">
                <button
                  onClick={() => handleProductSelect(product)}
                  className="select-btn"
                >
                  {selectedProducts.includes(product) ? 'Selected' : 'Select'}
                </button>
                <button
                  onClick={() => addToWishlist(product)}
                  className="wishlist-btn"
                >
                  Add to Wishlist
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Products Section */}
        {selectedProducts.length > 0 && (
          <div className="selected-products">
            <h2>Selected Products</h2>
            <div className="selected-grid">
              {selectedProducts.map(product => (
                <div key={product.id} className="selected-product">
                  <img src={product.image} alt={product.name} />
                  <h3>{product.name}</h3>
                  <p>Price: ${product.price.toFixed(2)}</p>
                  <button
                    onClick={() => handleProductSelect(product)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => requestQuote(selectedProducts)}
              className="request-quote-btn"
              disabled={loading}
            >
              {loading ? <Loading size="small" /> : 'Request Quote'}
            </button>
          </div>
        )}

        {/* Wishlist Section */}
        {wishlist.length > 0 && (
          <div className="wishlist-section">
            <h2>Wishlist</h2>
            <div className="wishlist-grid">
              {wishlist.map(product => (
                <div key={product.id} className="wishlist-item">
                  <img src={product.image} alt={product.name} />
                  <h3>{product.name}</h3>
                  <p>Price: ${product.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations Section */}
        {aiRecommendations.length > 0 && (
          <div className="ai-recommendations-section">
            <h2>AI Recommendations</h2>
            <div className="recommendations-grid">
              {aiRecommendations.map((recommendation, index) => (
                <div key={index} className="recommendation-item">
                  <div className="recommendation-content">
                    <h4>Smart Recommendation #{index + 1}</h4>
                    <p>{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ProductBrowser;
