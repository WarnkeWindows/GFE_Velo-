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
