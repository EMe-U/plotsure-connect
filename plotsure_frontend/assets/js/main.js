// Main Application Logic
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('🏞️ PlotSure Connect - Frontend Initialized');
    
    // Initialize UI components
    setupNavigation();
    setupForms();
    setupModals();
    hideLoading();
}

// Navigation
function setupNavigation() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            smoothScrollTo(targetId);
        });
    });

    // Header scroll effect
    let lastScrollTop = 0;
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            header.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = element.offsetTop - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Forms
function setupForms() {
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Inquiry form
    const inquiryForm = document.getElementById('inquiryForm');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', handleInquiryForm);
    }

    // Form validation
    setupFormValidation();
}

async function handleContactForm(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('contactName').value.trim(),
        email: document.getElementById('contactEmail').value.trim(),
        phone: document.getElementById('contactPhone').value.trim(),
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value.trim()
    };

    // Validate form
    if (!validateContactForm(formData)) {
        return;
    }

    try {
        const result = await contactAPI.submit(formData);
        
        if (result.success) {
            showMessage(APP_CONFIG.SUCCESS_MESSAGES.CONTACT_SENT, 'success');
            document.getElementById('contactForm').reset();
        } else {
            showMessage(result.error || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Contact form error:', error);
        showMessage('Failed to send message. Please try again.', 'error');
    }
}

async function handleInquiryForm(event) {
    event.preventDefault();
    
    const formData = {
        listing_id: parseInt(document.getElementById('inquiryListingId').value) || null,
        inquirer_name: document.getElementById('inquiryName').value.trim(),
        inquirer_email: document.getElementById('inquiryEmail').value.trim(),
        inquirer_phone: document.getElementById('inquiryPhone').value.trim(),
        inquirer_location: document.getElementById('inquiryLocation').value.trim(),
        inquiry_type: document.getElementById('inquiryType').value,
        message: document.getElementById('inquiryMessage').value.trim(),
        budget_min: parseInt(document.getElementById('inquiryBudgetMin').value) || null,
        budget_max: parseInt(document.getElementById('inquiryBudgetMax').value) || null,
        budget_currency: 'RWF',
        timeframe: document.getElementById('inquiryTimeframe').value,
        visit_preference: 'physical_visit',
        is_diaspora: document.getElementById('isDiaspora').checked,
        preferred_contact: 'email'
    };

    // Validate form
    if (!validateInquiryForm(formData)) {
        return;
    }

    try {
        const result = await inquiriesAPI.create(formData);
        
        if (result.success) {
            showMessage(APP_CONFIG.SUCCESS_MESSAGES.INQUIRY_SENT, 'success');
            document.getElementById('inquiryForm').reset();
            hideModal('inquiryModal');
        } else {
            showMessage(result.error || 'Failed to send inquiry', 'error');
        }
    } catch (error) {
        console.error('Inquiry form error:', error);
        showMessage('Failed to send inquiry. Please try again.', 'error');
    }
}

// Form Validation
function setupFormValidation() {
    // Real-time validation for email fields
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateEmailField(this);
        });
    });

    // Real-time validation for phone fields
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validatePhoneField(this);
        });
    });
}

function validateContactForm(data) {
    const errors = [];

    if (!data.name || data.name.length < 2) {
        errors.push('Name must be at least 2 characters long');
    }

    if (!validateEmail(data.email)) {
        errors.push('Please enter a valid email address');
    }

    if (!data.subject) {
        errors.push('Please select a subject');
    }

    if (!data.message || data.message.length < APP_CONFIG.VALIDATION.MIN_MESSAGE_LENGTH) {
        errors.push(`Message must be at least ${APP_CONFIG.VALIDATION.MIN_MESSAGE_LENGTH} characters long`);
    }

    if (data.message && data.message.length > APP_CONFIG.VALIDATION.MAX_MESSAGE_LENGTH) {
        errors.push(`Message cannot exceed ${APP_CONFIG.VALIDATION.MAX_MESSAGE_LENGTH} characters`);
    }

    if (data.phone && !validatePhone(data.phone)) {
        errors.push('Please enter a valid phone number');
    }

    if (errors.length > 0) {
        showMessage(errors.join('\n'), 'error');
        return false;
    }

    return true;
}

function validateInquiryForm(data) {
    const errors = [];

    if (!data.inquirer_name || data.inquirer_name.length < 2) {
        errors.push('Name must be at least 2 characters long');
    }

    if (!validateEmail(data.inquirer_email)) {
        errors.push('Please enter a valid email address');
    }

    if (!data.inquirer_phone || !validatePhone(data.inquirer_phone)) {
        errors.push('Please enter a valid phone number');
    }

    if (!data.inquiry_type) {
        errors.push('Please select an inquiry type');
    }

    if (!data.message || data.message.length < APP_CONFIG.VALIDATION.MIN_MESSAGE_LENGTH) {
        errors.push(`Message must be at least ${APP_CONFIG.VALIDATION.MIN_MESSAGE_LENGTH} characters long`);
    }

    if (data.message && data.message.length > APP_CONFIG.VALIDATION.MAX_MESSAGE_LENGTH) {
        errors.push(`Message cannot exceed ${APP_CONFIG.VALIDATION.MAX_MESSAGE_LENGTH} characters`);
    }

    if (data.budget_min && data.budget_max && data.budget_min > data.budget_max) {
        errors.push('Minimum budget cannot be greater than maximum budget');
    }

    if (errors.length > 0) {
        showMessage(errors.join('\n'), 'error');
        return false;
    }

    return true;
}

function validateEmailField(input) {
    const email = input.value.trim();
    const isValid = !email || validateEmail(email);
    
    input.classList.toggle('invalid', !isValid);
    
    return isValid;
}

function validatePhoneField(input) {
    const phone = input.value.trim();
    const isValid = !phone || validatePhone(phone);
    
    input.classList.toggle('invalid', !isValid);
    
    return isValid;
}

// Modal Management
function setupModals() {
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.getElementsByClassName('modal');
        for (let modal of modals) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const visibleModals = Array.from(document.getElementsByClassName('modal'))
                .filter(modal => modal.style.display === 'block');
            
            visibleModals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Loading States
function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'flex';
    }
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// Message System
function showMessage(message, type = 'info', duration = APP_CONFIG.MESSAGE_DURATION) {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1; white-space: pre-line;">${escapeHtml(message)}</div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; font-size: 1.2rem; cursor: pointer; margin-left: 1rem;">×</button>
        </div>
    `;

    container.appendChild(messageEl);

    // Auto-remove after duration
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, duration);
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatCurrency(amount, currency = 'RWF') {
    const symbol = APP_CONFIG.CURRENCY.SYMBOLS[currency] || currency;
    return `${new Intl.NumberFormat().format(amount)} ${symbol}`;
}

function formatDate(dateString, format = APP_CONFIG.DATE_FORMAT.SHORT) {
    const date = new Date(dateString);
    
    switch (format) {
        case 'short':
            return date.toLocaleDateString();
        case 'long':
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        case 'time':
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        case 'datetime':
            return `${date.toLocaleDateString()} ${date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        default:
            return date.toLocaleDateString();
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showMessage('Copied to clipboard!', 'success', 2000);
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showMessage('Copied to clipboard!', 'success', 2000);
    } catch (err) {
        showMessage('Failed to copy to clipboard', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Image handling
function handleImageError(img) {
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
        parent.style.display = 'flex';
        parent.style.alignItems = 'center';
        parent.style.justifyContent = 'center';
        parent.innerHTML = '<span style="font-size: 3rem;">🏞️</span>';
    }
}

function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Error handling
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    
    if (ENVIRONMENT.DEBUG) {
        showMessage(`Error: ${event.error.message}`, 'error');
    } else {
        showMessage('An unexpected error occurred. Please refresh the page.', 'error');
    }
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (ENVIRONMENT.DEBUG) {
        showMessage(`Promise rejection: ${event.reason}`, 'error');
    } else {
        showMessage('An unexpected error occurred. Please try again.', 'error');
    }
});

// Performance monitoring
if (ENVIRONMENT.DEBUG) {
    window.addEventListener('load', function() {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`🏞️ Page load time: ${loadTime}ms`);
    });
}

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator && FEATURE_FLAGS.ENABLE_NOTIFICATIONS) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Global functions
window.showModal = showModal;
window.hideModal = hideModal;
window.showMessage = showMessage;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.copyToClipboard = copyToClipboard;
window.handleImageError = handleImageError;
window.smoothScrollTo = smoothScrollTo;
window.debounce = debounce;
window.escapeHtml = escapeHtml;

// Initialize lazy loading when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(lazyLoadImages, 100);
});