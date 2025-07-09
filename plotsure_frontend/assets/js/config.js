// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api',
    ENDPOINTS: {
        // Authentication
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            PROFILE: '/auth/profile',
            LOGOUT: '/auth/logout'
        },
        // Listings
        LISTINGS: {
            BASE: '/listings',
            BY_ID: (id) => `/listings/${id}`,
            BROKER_LISTINGS: '/listings/broker/my-listings',
            STATS: '/listings/stats/overview',
            FEATURED: (id) => `/listings/${id}/featured`,
            VERIFY: (id) => `/listings/${id}/verify`
        },
        // Inquiries
        INQUIRIES: {
            BASE: '/inquiries',
            BY_ID: (id) => `/inquiries/${id}`,
            STATS: '/inquiries/stats',
            FOLLOW_UP: '/inquiries/follow-up',
            STATUS: (id) => `/inquiries/${id}/status`,
            ASSIGN: (id) => `/inquiries/${id}/assign`,
            CONVERT: (id) => `/inquiries/${id}/convert`
        },
        // Contact
        CONTACT: {
            BASE: '/contact',
            BY_ID: (id) => `/contact/${id}`,
            STATS: '/contact/stats',
            STATUS: (id) => `/contact/${id}/status`,
            ASSIGN: (id) => `/contact/${id}/assign`,
            RESPOND: (id) => `/contact/${id}/respond`
        }
    }
};

// Application Configuration
const APP_CONFIG = {
    // Pagination
    DEFAULT_PAGE_SIZE: 12,
    MAX_PAGE_SIZE: 50,
    
    // File Upload
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
    
    // UI
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500,
    
    // Messages
    MESSAGE_DURATION: 5000,
    
    // Local Storage Keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'plotsure_auth_token',
        USER_DATA: 'plotsure_user_data',
        SEARCH_FILTERS: 'plotsure_search_filters'
    },
    
    // Error Messages
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Network error. Please check your internet connection.',
        SERVER_ERROR: 'Server error. Please try again later.',
        VALIDATION_ERROR: 'Please check your input and try again.',
        AUTH_ERROR: 'Authentication failed. Please login again.',
        NOT_FOUND: 'The requested resource was not found.',
        PERMISSION_DENIED: 'You do not have permission to perform this action.',
        FILE_TOO_LARGE: 'File size is too large. Maximum size is 10MB.',
        INVALID_FILE_TYPE: 'Invalid file type. Please select a valid file.'
    },
    
    // Success Messages
    SUCCESS_MESSAGES: {
        LOGIN_SUCCESS: 'Login successful!',
        LOGOUT_SUCCESS: 'Logged out successfully!',
        INQUIRY_SENT: 'Your inquiry has been sent successfully!',
        CONTACT_SENT: 'Your message has been sent successfully!',
        PROFILE_UPDATED: 'Profile updated successfully!',
        LISTING_CREATED: 'Listing created successfully!',
        LISTING_UPDATED: 'Listing updated successfully!',
        LISTING_DELETED: 'Listing deleted successfully!'
    },
    
    // Form Validation
    VALIDATION: {
        MIN_PASSWORD_LENGTH: 6,
        MAX_MESSAGE_LENGTH: 2000,
        MIN_MESSAGE_LENGTH: 10,
        PHONE_PATTERN: /^\+?[1-9]\d{1,14}$/,
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    
    // Currency and Number Formatting
    CURRENCY: {
        DEFAULT: 'RWF',
        SYMBOLS: {
            RWF: 'RWF',
            USD: '$'
        }
    },
    
    // Date Formatting
    DATE_FORMAT: {
        SHORT: 'MMM DD, YYYY',
        LONG: 'MMMM DD, YYYY',
        TIME: 'HH:mm',
        DATETIME: 'MMM DD, YYYY HH:mm'
    }
};

// Feature Flags
const FEATURE_FLAGS = {
    ENABLE_REGISTRATION: false, // Disable public registration
    ENABLE_FILE_UPLOAD: true,
    ENABLE_VIDEO_UPLOAD: true,
    ENABLE_MAP_INTEGRATION: false, // Future feature
    ENABLE_PAYMENT_INTEGRATION: false, // Future feature
    ENABLE_CHAT: false, // Future feature
    ENABLE_NOTIFICATIONS: true,
    ENABLE_ANALYTICS: false // Future feature
};

// Environment Detection
const ENVIRONMENT = {
    IS_DEVELOPMENT: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    IS_PRODUCTION: window.location.hostname.includes('plotsureconnect'),
    DEBUG: window.location.hostname === 'localhost'
};

// Debug Configuration
if (ENVIRONMENT.DEBUG) {
    window.API_CONFIG = API_CONFIG;
    window.APP_CONFIG = APP_CONFIG;
    window.FEATURE_FLAGS = FEATURE_FLAGS;
    console.log('🏞️ PlotSure Connect - Debug Mode Enabled');
    console.log('API Base URL:', API_CONFIG.BASE_URL);
}