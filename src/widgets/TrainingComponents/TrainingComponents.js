import React, { useState, useEffect } from 'react';
import './TrainingComponents.css';
import Error from '../shared/components/Error.js';
import Loading from '../shared/components/Loading.js';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import { apiService } from '../shared/services/api-service';
import { analyticsService } from '../shared/services/analytics-service';

const TrainingComponents = () => {
  const [brands, setBrands] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [systemConfig, setSystemConfig] = useState(null);

  useEffect(() => {
    const fetchTrainingData = async () => {
      try {
        // Track page view
        analyticsService.trackPageView('Training Components');
        
        // Get system configuration
        const config = await apiService.getSystemConfig();
        setSystemConfig(config);
        
        // Fetch training data using unified API
        const [brandsData, modulesData] = await Promise.all([
          apiService.callBackendFunction('getTrainingBrands'),
          apiService.callBackendFunction('getTrainingModules')
        ]);
        
        setBrands(brandsData || []);
        setModules(modulesData || []);
        
        // Generate AI summary of training content if enabled
        if (config?.features?.aiEnabled && modulesData?.length > 0) {
          try {
            const summaryPrompt = `Summarize the ${modulesData.length} training modules available for window installation training.`;
            const summary = await apiService.processAIChat(summaryPrompt, 'anthropic', {
              maxTokens: 256
            });
            setAiSummary(summary?.content);
          } catch (aiError) {
            console.warn('AI summary generation failed:', aiError);
          }
        }
      } catch (err) {
        setError('Failed to load training data');
        
        // Enhanced error tracking
        await apiService.logError(err, {
          component: 'TrainingComponents',
          action: 'fetchTrainingData'
        });
        
        analyticsService.trackError({
          error: err.message,
          context: 'Training Data Loading'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingData();
  }, []);

  const showBrandDetails = async (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
      setSelectedBrand(brand);
      
      // Track brand selection
      analyticsService.trackEvent('Training Brand Selected', {
        brandId: brand.id,
        brandName: brand.name
      });
    }
  };

  const startTraining = async (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      setSelectedModule(module);
      
      // Track training module start
      analyticsService.trackEvent('Training Module Started', {
        moduleId: module.id,
        moduleTitle: module.title,
        category: module.category
      });
      
      // Log training session start
      try {
        await apiService.callBackendFunction('logTrainingSession', {
          moduleId: module.id,
          action: 'start',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to log training session:', error);
      }
    }
  };

  if (loading) {
    return <Loading size="large" />;
  }

  if (error) {
    return <Error message={error} onClose={() => setError(null)} />;
  }

  return (
    <ErrorBoundary componentName="TrainingComponents">
      <div className="training-container">
        {/* AI Summary Section */}
        {aiSummary && (
          <div className="ai-summary-section">
            <h2>Training Overview</h2>
            <div className="ai-summary">
              <p>{aiSummary}</p>
            </div>
          </div>
        )}

        <div className="brand-cards">
          {brands.map(brand => (
            <div 
              key={brand.id}
              className="brand-card"
              onClick={() => showBrandDetails(brand.id)}
            >
              <div className="brand-header">
                <img 
                  src={brand.logo}
                  alt={brand.name}
                  className="brand-logo"
                />
                <h3 className="brand-name">{brand.name}</h3>
              </div>
              <p className="brand-description">{brand.description}</p>
            </div>
          ))}
        </div>

      <div className="training-modules">
        {modules.map(module => (
          <div 
            key={module.id}
            className="module-card"
            onClick={() => startTraining(module.id)}
          >
            <h3>{module.title}</h3>
            <p>{module.description}</p>
            <span className="category">{module.category}</span>
          </div>
        ))}
      </div>

      {selectedBrand && (
        <div className="brand-details">
          <h2>{selectedBrand.name}</h2>
          <p>{selectedBrand.details}</p>
          <button onClick={() => setSelectedBrand(null)}>Close</button>
        </div>
      )}

      {selectedModule && (
        <div className="module-content">
          <h2>{selectedModule.title}</h2>
          <div dangerouslySetInnerHTML={{ __html: selectedModule.content }} />
          <button onClick={() => setSelectedModule(null)}>Close</button>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default TrainingComponents;
