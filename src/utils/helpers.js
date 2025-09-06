/**
 * Utility functions for the PlastixThinker application
 */

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date to readable string
 */
export function formatDate(date) {
  if (!date) return 'Unknown';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate a random string for temporary filenames
 */
export function generateTempFilename(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName ? originalName.split('.').pop() : 'tmp';
  return `${timestamp}_${random}.${extension}`;
}

/**
 * Validate email format (basic validation)
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Truncate text to specified length
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Calculate similarity percentage from cosine similarity
 */
export function similarityToPercentage(similarity) {
  if (similarity < 0) return 0;
  if (similarity > 1) return 100;
  
  return Math.round(similarity * 100);
}

/**
 * Generate a unique session ID
 */
export function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Check if a string contains potentially dangerous content
 */
export function containsDangerousContent(text) {
  if (!text) return false;
  
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(text));
}

/**
 * Validate file type based on MIME type and extension
 */
export function isValidFileType(mimeType, filename) {
  const allowedMimeTypes = [
    'text/plain',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const allowedExtensions = ['.txt', '.pdf', '.csv', '.xls', '.xlsx'];
  
  const hasValidMimeType = allowedMimeTypes.includes(mimeType);
  const hasValidExtension = allowedExtensions.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );
  
  return hasValidMimeType && hasValidExtension;
}
