// app/suppress-warnings.ts
// This file helps suppress source map warnings in development

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error
  const originalWarn = console.warn
  
  console.error = (...args) => {
    const errorString = args.join(' ')
    
    // Suppress specific source map errors
    if (
      errorString.includes('Invalid source map') ||
      errorString.includes('Failed to parse source map') ||
      errorString.includes('@google-cloud') ||
      errorString.includes('firestore') ||
      errorString.includes('ERR_INVALID_ARG_TYPE')
    ) {
      return
    }
    
    originalError.apply(console, args)
  }
  
  console.warn = (...args) => {
    const warnString = args.join(' ')
    
    // Suppress specific warnings
    if (
      warnString.includes('source map') ||
      warnString.includes('@google-cloud') ||
      warnString.includes('firestore')
    ) {
      return
    }
    
    originalWarn.apply(console, args)
  }
}