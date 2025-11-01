/**
 * Simple sanitizer to protect from XSS attacks
 * Trims strings, escapes HTML characters, and truncates to safe lengths
 */

// Escape HTML characters to prevent XSS
const escapeHtml = (text) => {
    if (typeof text !== 'string') return text;
    
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
};

// Sanitize text input with optional max length
const sanitizeText = (text, maxLength = null) => {
    if (!text || typeof text !== 'string') return '';
    
    // Trim whitespace
    let sanitized = text.trim();
    
    // Escape HTML characters
    sanitized = escapeHtml(sanitized);
    
    // Truncate if max length specified
    if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
};

// Sanitize name (for user names, etc.)
const sanitizeName = (name) => {
    return sanitizeText(name, 100); // Max 100 characters for names
};

// Sanitize bio text
const sanitizeBio = (bio) => {
    return sanitizeText(bio, 500); // Max 500 characters for bio
};

// Sanitize post text
const sanitizePostText = (text) => {
    return sanitizeText(text, 500); // Max 500 characters for posts
};

// Sanitize comment text
const sanitizeCommentText = (text) => {
    return sanitizeText(text, 300); // Max 300 characters for comments
};

// General purpose sanitizer for any text field
const sanitize = (text, maxLength = null) => {
    return sanitizeText(text, maxLength);
};

module.exports = {
    sanitize,
    sanitizeName,
    sanitizeBio,
    sanitizePostText,
    sanitizeCommentText,
    escapeHtml
};