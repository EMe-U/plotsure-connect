// API Utility Functions
class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    // Get authentication token
    getAuthToken() {
        return localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    }

    // Set authentication token
    setAuthToken(token) {
        if (token) {
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
        } else {
            localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        }
    }

    // Get authenticated headers
    getAuthHeaders() {
        const token = this.getAuthToken();
        const headers = { ...this.defaultHeaders };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    // Make HTTP request
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers
            }
        };

        try {
            showLoading();
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || this.getErrorMessage(response.status));
            }

            return { success: true, data: data.data, message: data.message };
        } catch (error) {
            console.error('API Request Error:', error);
            return { 
                success: false, 
                error: error.message || APP_CONFIG.ERROR_MESSAGES.NETWORK_ERROR 
            };
        } finally {
            hideLoading();
        }
    }

    // Get error message based on status code
    getErrorMessage(status) {
        switch (status) {
            case 400:
                return APP_CONFIG.ERROR_MESSAGES.VALIDATION_ERROR;
            case 401:
                return APP_CONFIG.ERROR_MESSAGES.AUTH_ERROR;
            case 403:
                return APP_CONFIG.ERROR_MESSAGES.PERMISSION_DENIED;
            case 404:
                return APP_CONFIG.ERROR_MESSAGES.NOT_FOUND;
            case 500:
                return APP_CONFIG.ERROR_MESSAGES.SERVER_ERROR;
            default:
                return APP_CONFIG.ERROR_MESSAGES.NETWORK_ERROR;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const urlParams = new URLSearchParams(params);
        const url = urlParams.toString() ? `${endpoint}?${urlParams}` : endpoint;
        
        return this.makeRequest(url, {
            method: 'GET'
        });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.makeRequest(endpoint, {
            method: 'DELETE'
        });
    }

    // POST with file upload
    async postFormData(endpoint, formData) {
        const token = this.getAuthToken();
        const headers = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return this.makeRequest(endpoint, {
            method: 'POST',
            headers,
            body: formData
        });
    }
}

// Create API client instance
const api = new ApiClient();

// Authentication API
const authAPI = {
    async login(email, password) {
        const result = await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
            email,
            password
        });

        if (result.success && result.data.token) {
            api.setAuthToken(result.data.token);
            localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(result.data.user));
        }

        return result;
    },

    async register(userData) {
        return api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
    },

    async getProfile() {
        return api.get(API_CONFIG.ENDPOINTS.AUTH.PROFILE);
    },

    async updateProfile(userData) {
        return api.put(API_CONFIG.ENDPOINTS.AUTH.PROFILE, userData);
    },

    async changePassword(currentPassword, newPassword) {
        return api.put('/auth/change-password', {
            currentPassword,
            newPassword,
            confirmPassword: newPassword
        });
    },

    logout() {
        api.setAuthToken(null);
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
        return { success: true };
    },

    getCurrentUser() {
        const userData = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
        return userData ? JSON.parse(userData) : null;
    },

    isAuthenticated() {
        return !!api.getAuthToken();
    }
};

// Listings API
const listingsAPI = {
    async getAll(params = {}) {
        return api.get(API_CONFIG.ENDPOINTS.LISTINGS.BASE, params);
    },

    async getById(id) {
        return api.get(API_CONFIG.ENDPOINTS.LISTINGS.BY_ID(id));
    },

    async create(listingData, files = null) {
        if (files) {
            const formData = new FormData();
            
            // Add listing data
            Object.keys(listingData).forEach(key => {
                formData.append(key, listingData[key]);
            });

            // Add files
            if (files.documents) {
                files.documents.forEach(file => {
                    formData.append('documents', file);
                });
            }
            if (files.images) {
                files.images.forEach(file => {
                    formData.append('images', file);
                });
            }
            if (files.videos) {
                files.videos.forEach(file => {
                    formData.append('videos', file);
                });
            }

            return api.postFormData(API_CONFIG.ENDPOINTS.LISTINGS.BASE, formData);
        } else {
            return api.post(API_CONFIG.ENDPOINTS.LISTINGS.BASE, listingData);
        }
    },

    async update(id, listingData) {
        return api.put(API_CONFIG.ENDPOINTS.LISTINGS.BY_ID(id), listingData);
    },

    async delete(id) {
        return api.delete(API_CONFIG.ENDPOINTS.LISTINGS.BY_ID(id));
    },

    async getBrokerListings(params = {}) {
        return api.get(API_CONFIG.ENDPOINTS.LISTINGS.BROKER_LISTINGS, params);
    },

    async getStats() {
        return api.get(API_CONFIG.ENDPOINTS.LISTINGS.STATS);
    },

    async toggleFeatured(id, featured) {
        return api.put(API_CONFIG.ENDPOINTS.LISTINGS.FEATURED(id), { featured });
    },

    async verify(id, notes = '') {
        return api.put(API_CONFIG.ENDPOINTS.LISTINGS.VERIFY(id), { verification_notes: notes });
    }
};

// Inquiries API
const inquiriesAPI = {
    async create(inquiryData) {
        return api.post(API_CONFIG.ENDPOINTS.INQUIRIES.BASE, inquiryData);
    },

    async getAll(params = {}) {
        return api.get(API_CONFIG.ENDPOINTS.INQUIRIES.BASE, params);
    },

    async getById(id) {
        return api.get(API_CONFIG.ENDPOINTS.INQUIRIES.BY_ID(id));
    },

    async updateStatus(id, statusData) {
        return api.put(API_CONFIG.ENDPOINTS.INQUIRIES.STATUS(id), statusData);
    },

    async assign(id, brokerId) {
        return api.put(API_CONFIG.ENDPOINTS.INQUIRIES.ASSIGN(id), { assigned_to: brokerId });
    },

    async markConverted(id, conversionValue = null) {
        return api.put(API_CONFIG.ENDPOINTS.INQUIRIES.CONVERT(id), { conversion_value: conversionValue });
    },

    async getStats() {
        return api.get(API_CONFIG.ENDPOINTS.INQUIRIES.STATS);
    },

    async getFollowUp() {
        return api.get(API_CONFIG.ENDPOINTS.INQUIRIES.FOLLOW_UP);
    },

    async delete(id) {
        return api.delete(API_CONFIG.ENDPOINTS.INQUIRIES.BY_ID(id));
    }
};

// Contact API
const contactAPI = {
    async submit(contactData) {
        return api.post(API_CONFIG.ENDPOINTS.CONTACT.BASE, contactData);
    },

    async getAll(params = {}) {
        return api.get(API_CONFIG.ENDPOINTS.CONTACT.BASE, params);
    },

    async getById(id) {
        return api.get(API_CONFIG.ENDPOINTS.CONTACT.BY_ID(id));
    },

    async updateStatus(id, statusData) {
        return api.put(API_CONFIG.ENDPOINTS.CONTACT.STATUS(id), statusData);
    },

    async assign(id, userId) {
        return api.put(API_CONFIG.ENDPOINTS.CONTACT.ASSIGN(id), { assigned_to: userId });
    },

    async respond(id, responseMessage, sendEmail = true) {
        return api.put(API_CONFIG.ENDPOINTS.CONTACT.RESPOND(id), {
            response_message: responseMessage,
            send_email: sendEmail
        });
    },

    async getStats() {
        return api.get(API_CONFIG.ENDPOINTS.CONTACT.STATS);
    },

    async delete(id) {
        return api.delete(API_CONFIG.ENDPOINTS.CONTACT.BY_ID(id));
    }
};

// Export APIs for global access
window.api = api;
window.authAPI = authAPI;
window.listingsAPI = listingsAPI;
window.inquiriesAPI = inquiriesAPI;
window.contactAPI = contactAPI;