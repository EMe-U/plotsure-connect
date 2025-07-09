// Authentication Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        this.currentUser = authAPI.getCurrentUser();
        this.updateUI();
        
        // Set up login form handler
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Validate inputs
        if (!email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        if (!APP_CONFIG.VALIDATION.EMAIL_PATTERN.test(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        try {
            const result = await authAPI.login(email, password);
            
            if (result.success) {
                this.currentUser = result.data.user;
                this.updateUI();
                hideModal('loginModal');
                showMessage(APP_CONFIG.SUCCESS_MESSAGES.LOGIN_SUCCESS, 'success');
                
                // Reset form
                document.getElementById('loginForm').reset();
                
                // Redirect to dashboard if broker/admin
                if (this.currentUser.role === 'broker' || this.currentUser.role === 'admin') {
                    setTimeout(() => {
                        window.location.href = 'admin/dashboard.html';
                    }, 1000);
                }
            } else {
                showMessage(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Login failed. Please try again.', 'error');
        }
    }

    async logout() {
        try {
            authAPI.logout();
            this.currentUser = null;
            this.updateUI();
            showMessage(APP_CONFIG.SUCCESS_MESSAGES.LOGOUT_SUCCESS, 'success');
            
            // Redirect to home if on admin page
            if (window.location.pathname.includes('admin')) {
                window.location.href = '../index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            showMessage('Logout failed', 'error');
        }
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const dashboardBtn = document.getElementById('dashboardBtn');

        if (this.currentUser) {
            // User is logged in
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            
            // Show dashboard button for brokers/admins
            if (dashboardBtn && (this.currentUser.role === 'broker' || this.currentUser.role === 'admin')) {
                dashboardBtn.style.display = 'inline-block';
            }
        } else {
            // User is not logged in
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (dashboardBtn) dashboardBtn.style.display = 'none';
        }
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    isBroker() {
        return this.currentUser && (this.currentUser.role === 'broker' || this.currentUser.role === 'admin');
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user has permission for certain actions
    hasPermission(action) {
        if (!this.currentUser) return false;

        switch (action) {
            case 'create_listing':
                return this.currentUser.role === 'broker' || this.currentUser.role === 'admin';
            case 'manage_listings':
                return this.currentUser.role === 'broker' || this.currentUser.role === 'admin';
            case 'verify_listings':
                return this.currentUser.role === 'admin';
            case 'manage_users':
                return this.currentUser.role === 'admin';
            default:
                return false;
        }
    }

    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            showMessage('Please login to access this feature', 'error');
            showModal('loginModal');
            return false;
        }
        return true;
    }

    // Redirect if not broker
    requireBrokerAuth() {
        if (!this.isBroker()) {
            showMessage('Access denied. Broker privileges required.', 'error');
            return false;
        }
        return true;
    }

    // Redirect if not admin
    requireAdminAuth() {
        if (!this.isAdmin()) {
            showMessage('Access denied. Admin privileges required.', 'error');
            return false;
        }
        return true;
    }
}

// Password validation
function validatePassword(password) {
    const errors = [];
    
    if (password.length < APP_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
        errors.push(`Password must be at least ${APP_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} characters long`);
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Email validation
function validateEmail(email) {
    return APP_CONFIG.VALIDATION.EMAIL_PATTERN.test(email);
}

// Phone validation
function validatePhone(phone) {
    return APP_CONFIG.VALIDATION.PHONE_PATTERN.test(phone);
}

// Registration form handler (if enabled)
function handleRegistration(event) {
    event.preventDefault();
    
    if (!FEATURE_FLAGS.ENABLE_REGISTRATION) {
        showMessage('Registration is currently disabled. Please contact an administrator.', 'error');
        return;
    }
    
    // Registration logic would go here
    showMessage('Registration is currently by invitation only.', 'error');
}

// Initialize auth manager
let authManager;

document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
    
    // Global logout function
    window.logout = () => authManager.logout();
    
    // Make auth manager globally available
    window.authManager = authManager;
});

// Export for use in other modules
window.AuthManager = AuthManager;
window.validatePassword = validatePassword;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;