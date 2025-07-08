/**
 * Common Utilities for GFE Velo Backend
 * File: backend/common-utils.web.js
 */

/**
 * Data transformation utilities
 */
export class DataUtils {
  /**
   * Convert camelCase to snake_case
   */
  static camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert snake_case to camelCase
   */
  static snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert camelCase to kebab-case
   */
  static camelToKebab(str) {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  }

  /**
   * Convert kebab-case to camelCase
   */
  static kebabToCamel(str) {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Deep clone an object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }

    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key]);
      });
      return cloned;
    }

    return obj;
  }

  /**
   * Merge objects deeply
   */
  static deepMerge(target, source) {
    const result = this.deepClone(target);

    Object.keys(source).forEach(key => {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (this.isObject(sourceValue) && this.isObject(targetValue)) {
        result[key] = this.deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    });

    return result;
  }

  /**
   * Check if value is a plain object
   */
  static isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
  }

  /**
   * Flatten nested object to dot notation
   */
  static flatten(obj, prefix = '') {
    const flattened = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (this.isObject(value)) {
        Object.assign(flattened, this.flatten(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    });

    return flattened;
  }

  /**
   * Unflatten dot notation object to nested structure
   */
  static unflatten(obj) {
    const result = {};

    Object.keys(obj).forEach(key => {
      const keys = key.split('.');
      let current = result;

      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          current[k] = obj[key];
        } else {
          if (!current[k]) {
            current[k] = {};
          }
          current = current[k];
        }
      });
    });

    return result;
  }

  /**
   * Remove undefined and null values from object
   */
  static removeEmpty(obj) {
    const cleaned = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      if (value !== null && value !== undefined) {
        if (this.isObject(value)) {
          const cleanedNested = this.removeEmpty(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else if (Array.isArray(value)) {
          const cleanedArray = value.filter(item => item !== null && item !== undefined);
          if (cleanedArray.length > 0) {
            cleaned[key] = cleanedArray;
          }
        } else {
          cleaned[key] = value;
        }
      }
    });

    return cleaned;
  }
}

/**
 * String manipulation utilities
 */
export class StringUtils {
  /**
   * Capitalize first letter of string
   */
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert string to title case
   */
  static toTitleCase(str) {
    return str.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Generate slug from string
   */
  static slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Truncate string with ellipsis
   */
  static truncate(str, length, suffix = '...') {
    if (str.length <= length) {
      return str;
    }
    return str.substring(0, length - suffix.length) + suffix;
  }

  /**
   * Generate a random string
   */
  static generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Check if email is valid
   */
  static isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  /**
   * Check if phone number is valid
   */
  static isValidPhone(phone) {
    // Basic validation for 10-15 digit phone numbers
    const re = /^\+?[0-9]{10,15}$/;
    return re.test(String(phone));
  }

  /**
   * Check if URL is valid
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Basic credit card validation (Luhn algorithm)
   */
  static isValidCreditCard(cardNumber) {
    if (!/^\d+$/.test(cardNumber)) {
      return false;
    }
    
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return (sum % 10) === 0;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password) {
    const result = {
      isValid: true,
      score: 0,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSymbol: false,
      isLongEnough: false
    };

    if (password.length >= 8) {
      result.score++;
      result.isLongEnough = true;
    }
    if (/[A-Z]/.test(password)) {
      result.score++;
      result.hasUpperCase = true;
    }
    if (/[a-z]/.test(password)) {
      result.score++;
      result.hasLowerCase = true;
    }
    if (/\d/.test(password)) {
      result.score++;
      result.hasNumber = true;
    }
    if (/[^A-Za-z0-9]/.test(password)) {
      result.score++;
      result.hasSymbol = true;
    }

    result.isValid = result.score >= 4 && result.isLongEnough;
    return result;
  }
}

/**
 * File handling utilities
 */
export class FileUtils {
  /**
   * Get file extension
   */
  static getExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if a file is an image
   */
  static isImageFile(filename) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const extension = this.getExtension(filename).toLowerCase();
    return imageExtensions.includes(extension);
  }

  /**
   * Generate a unique filename
   */
  static generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = this.getExtension(originalName);
    const basename = originalName.replace(`.${extension}`, '').replace(/[^a-zA-Z0-9]/g, '_');
    return `${basename}_${timestamp}_${randomString}.${extension}`;
  }
}

/**
 * Window measurement utilities
 */
export class WindowMeasurementUtils {
  /**
   * Calculate universal inches
   */
  static calculateUniversalInches(width, height) {
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      throw new Error('Invalid window dimensions');
    }
    return width + height;
  }

  /**
   * Calculate window area
   */
  static calculateArea(width, height) {
    return width * height;
  }

  /**
   * Calculate window perimeter
   */
  static calculatePerimeter(width, height) {
    return 2 * (width + height);
  }

  /**
   * Validate window measurements
   */
  static validateMeasurements(width, height) {
    const errors = [];
    if (isNaN(width) || width <= 0) {
      errors.push('Width must be a positive number.');
    }
    if (isNaN(height) || height <= 0) {
      errors.push('Height must be a positive number.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Reference objects for image analysis
   */
  static REFERENCE_OBJECTS = {
    'dollar_bill': { width: 6.14, height: 2.61 },
    'credit_card': { width: 3.37, height: 2.125 },
    'a4_paper': { width: 8.27, height: 11.69 },
    'quarter_coin': { diameter: 0.955 }
  };

  /**
   * Estimate dimensions from image
   */
  static estimateDimensionsFromImage(imageData, referenceObject, referenceObjectInImage) {
    // This is a placeholder for a complex image analysis function
    // In a real scenario, this would involve computer vision libraries
    if (!this.REFERENCE_OBJECTS[referenceObject]) {
      throw new Error('Invalid reference object');
    }

    const { pixelWidth, pixelHeight } = referenceObjectInImage;
    const { width: refWidth } = this.REFERENCE_OBJECTS[referenceObject];

    const pixelsPerInch = pixelWidth / refWidth;
    const estimatedWidth = imageData.pixelWidth / pixelsPerInch;
    const estimatedHeight = imageData.pixelHeight / pixelsPerInch;

    return {
      estimatedWidth: estimatedWidth.toFixed(2),
      estimatedHeight: estimatedHeight.toFixed(2)
    };
  }
}

