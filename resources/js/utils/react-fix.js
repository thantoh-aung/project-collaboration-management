// Fix for React DataCloneError in development mode
// This prevents React's performance monitoring from cloning objects with React symbols

if (process.env.NODE_ENV === 'development') {
  // Override the problematic performance.measure method
  const originalMeasure = performance.measure;
  
  performance.measure = function(name, startMark, endMark) {
    try {
      return originalMeasure.call(this, name, startMark, endMark);
    } catch (error) {
      if (error.name === 'DataCloneError') {
        // Silently ignore DataCloneError in development
        return;
      }
      throw error;
    }
  };
  
  // Also override console.log to prevent object cloning issues
  const originalLog = console.log;
  console.log = function(...args) {
    try {
      return originalLog.apply(this, args);
    } catch (error) {
      if (error.name === 'DataCloneError') {
        // Silently ignore DataCloneError
        return;
      }
      throw error;
    }
  };
}
