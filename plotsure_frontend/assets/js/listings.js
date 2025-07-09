// Listings Management
class ListingsManager {
    constructor() {
        this.currentPage = 1;
        this.currentFilters = {};
        this.listings = [];
        this.totalPages = 1;
        this.init();
    }

    init() {
        this.loadListings();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search form
        const searchBtn = document.querySelector('.search-form button');
        if (searchBtn) {
            searchBtn.addEventListener('click', this.handleSearch.bind(this));
        }

        // Search inputs with debounce
        const searchInputs = document.querySelectorAll('.search-form input, .search-form select');
        searchInputs.forEach(input => {
            input.addEventListener('input', debounce(this.handleSearch.bind(this), APP_CONFIG.DEBOUNCE_DELAY));
        });
    }

    async loadListings(page = 1, filters = {}) {
        try {
            this.currentPage = page;
            this.currentFilters = { ...filters };

            const params = {
                page,
                limit: APP_CONFIG.DEFAULT_PAGE_SIZE,
                status: 'active',
                ...filters
            };

            const result = await listingsAPI.getAll(params);

            if (result.success) {
                this.listings = result.data.listings || [];
                this.totalPages = result.data.pagination?.totalPages || 1;
                
                this.renderListings();
                this.renderPagination();
                await this.loadStats();
            } else {
                this.renderError(result.error);
            }
        } catch (error) {
            console.error('Load listings error:', error);
            this.renderError('Failed to load listings');
        }
    }

    async loadStats() {
        try {
            const result = await listingsAPI.getStats();
            if (result.success) {
                this.updateStatsDisplay(result.data);
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    }

    updateStatsDisplay(stats) {
        const verifiedListingsEl = document.getElementById('verifiedListings');
        const totalViewsEl = document.getElementById('totalViews');
        const successfulDealsEl = document.getElementById('successfulDeals');

        if (verifiedListingsEl) {
            verifiedListingsEl.textContent = stats.active_listings || 0;
        }
        if (totalViewsEl) {
            totalViewsEl.textContent = this.formatNumber(stats.total_views || 0);
        }
        if (successfulDealsEl) {
            successfulDealsEl.textContent = stats.sold_listings || 0;
        }
    }

    handleSearch() {
        const searchLocation = document.getElementById('searchLocation')?.value || '';
        const priceRange = document.getElementById('priceRange')?.value || '';
        const landSize = document.getElementById('landSize')?.value || '';
        const landType = document.getElementById('landType')?.value || '';

        const filters = {};

        // Location search
        if (searchLocation.trim()) {
            filters.search = searchLocation.trim();
        }

        // Price range
        if (priceRange) {
            const [min, max] = priceRange.split('-');
            if (min && min !== '0') filters.min_price = parseInt(min);
            if (max && max !== '+') filters.max_price = parseInt(max);
        }

        // Land size
        if (landSize) {
            const [min, max] = landSize.split('-');
            if (min && min !== '0') filters.min_size = parseInt(min);
            if (max && max !== '+') filters.max_size = parseInt(max);
        }

        // Land type
        if (landType) {
            filters.land_type = landType;
        }

        this.loadListings(1, filters);
    }

    renderListings() {
        const grid = document.getElementById('listingsGrid');
        if (!grid) return;

        if (this.listings.length === 0) {
            grid.innerHTML = this.renderEmptyState();
            return;
        }

        grid.innerHTML = this.listings.map(listing => this.renderListingCard(listing)).join('');
    }

    renderListingCard(listing) {
        const primaryImage = listing.media?.find(m => m.is_primary) || listing.media?.[0];
        const imageUrl = primaryImage ? `${API_CONFIG.BASE_URL.replace('/api', '')}${primaryImage.file_path}` : null;
        
        const features = this.getListingFeatures(listing);
        const location = this.getFullLocation(listing);
        const price = this.formatPrice(listing.price_amount, listing.price_currency);

        return `
            <div class="listing-card" data-listing-id="${listing.id}">
                <div class="listing-image">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${listing.title}" loading="lazy">` : '🏞️'}
                    <div class="verified-badge">✅ Verified</div>
                </div>
                <div class="listing-content">
                    <h3 class="listing-title">${this.escapeHtml(listing.title)}</h3>
                    <div class="listing-location">${this.escapeHtml(location)}</div>
                    <div class="listing-details">
                        <div class="listing-price">${price}</div>
                        <div class="listing-size">${listing.land_size_value} ${listing.land_size_unit}</div>
                    </div>
                    <div class="listing-features">
                        ${features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                    </div>
                    <div class="listing-actions">
                        <button class="btn btn-outline btn-small" onclick="viewListing(${listing.id})">View Details</button>
                        <button class="btn btn-primary btn-small" onclick="inquireAboutListing(${listing.id})">Inquire</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderPagination() {
        const paginationEl = document.getElementById('pagination');
        if (!paginationEl || this.totalPages <= 1) {
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }

        const pagination = [];

        // Previous button
        pagination.push(`
            <button ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="listingsManager.loadListings(${this.currentPage - 1}, listingsManager.currentFilters)">
                Previous
            </button>
        `);

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        if (startPage > 1) {
            pagination.push(`<button onclick="listingsManager.loadListings(1, listingsManager.currentFilters)">1</button>`);
            if (startPage > 2) {
                pagination.push(`<span>...</span>`);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pagination.push(`
                <button ${i === this.currentPage ? 'class="active"' : ''} 
                        onclick="listingsManager.loadListings(${i}, listingsManager.currentFilters)">
                    ${i}
                </button>
            `);
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                pagination.push(`<span>...</span>`);
            }
            pagination.push(`<button onclick="listingsManager.loadListings(${this.totalPages}, listingsManager.currentFilters)">${this.totalPages}</button>`);
        }

        // Next button
        pagination.push(`
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                    onclick="listingsManager.loadListings(${this.currentPage + 1}, listingsManager.currentFilters)">
                Next
            </button>
        `);

        paginationEl.innerHTML = pagination.join('');
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>No listings found</h3>
                <p>Try adjusting your search filters or check back later for new listings.</p>
            </div>
        `;
    }

    renderError(message) {
        const grid = document.getElementById('listingsGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="error-state">
                <h3>Error Loading Listings</h3>
                <p>${this.escapeHtml(message)}</p>
                <button class="btn btn-primary" onclick="listingsManager.loadListings()">Try Again</button>
            </div>
        `;
    }

    async viewListing(id) {
        try {
            const result = await listingsAPI.getById(id);
            
            if (result.success) {
                this.showListingModal(result.data.listing);
            } else {
                showMessage(result.error || 'Failed to load listing details', 'error');
            }
        } catch (error) {
            console.error('View listing error:', error);
            showMessage('Failed to load listing details', 'error');
        }
    }

    showListingModal(listing) {
        const modal = document.getElementById('listingDetailsModal');
        const title = document.getElementById('listingModalTitle');
        const content = document.getElementById('listingModalContent');

        if (!modal || !title || !content) return;

        title.textContent = listing.title;
        content.innerHTML = this.renderListingDetails(listing);
        
        showModal('listingDetailsModal');
    }

    renderListingDetails(listing) {
        const images = listing.media?.filter(m => m.media_type === 'image') || [];
        const videos = listing.media?.filter(m => m.media_type === 'video') || [];
        const documents = listing.documents || [];
        const features = this.getListingFeatures(listing);
        const location = this.getFullLocation(listing);
        const price = this.formatPrice(listing.price_amount, listing.price_currency);

        return `
            <div class="listing-gallery">
                ${images.length > 0 ? this.renderImageGallery(images) : '<div class="no-images">No images available</div>'}
            </div>
            
            <div class="listing-info">
                <div class="listing-main-info">
                    <h3>${this.escapeHtml(listing.title)}</h3>
                    <p class="listing-location">📍 ${this.escapeHtml(location)}</p>
                    
                    <div class="listing-details-grid">
                        <div class="detail-item">
                            <div class="detail-label">Price</div>
                            <div class="detail-value">${price}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Size</div>
                            <div class="detail-value">${listing.land_size_value} ${listing.land_size_unit}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Type</div>
                            <div class="detail-value">${this.capitalizeFirst(listing.land_type)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Soil Type</div>
                            <div class="detail-value">${this.capitalizeFirst(listing.soil_type)}</div>
                        </div>
                    </div>
                    
                    <div class="listing-features">
                        ${features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                    </div>
                    
                    <div class="listing-description">
                        <h4>Description</h4>
                        <p>${this.escapeHtml(listing.description)}</p>
                    </div>
                    
                    ${documents.length > 0 ? this.renderDocuments(documents) : ''}
                    
                    <div class="listing-actions" style="margin-top: 2rem;">
                        <button class="btn btn-primary" onclick="inquireAboutListing(${listing.id}, '${this.escapeHtml(listing.title)}')">Send Inquiry</button>
                        <button class="btn btn-outline" onclick="hideModal('listingDetailsModal')">Close</button>
                    </div>
                </div>
                
                <div class="listing-sidebar">
                    <div class="broker-info">
                        <h4>Contact Broker</h4>
                        <p><strong>${this.escapeHtml(listing.broker?.name || 'N/A')}</strong></p>
                        <p>📧 ${this.escapeHtml(listing.broker?.email || 'N/A')}</p>
                        <p>📞 ${this.escapeHtml(listing.broker?.phone || 'N/A')}</p>
                    </div>
                    
                    <div class="listing-stats">
                        <h4>Listing Stats</h4>
                        <p>Views: ${listing.views_count || 0}</p>
                        <p>Inquiries: ${listing.inquiries_count || 0}</p>
                        <p>Reference: ${listing.listing_reference || 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderImageGallery(images) {
        if (images.length === 0) return '';

        const mainImage = images[0];
        const imageUrl = `${API_CONFIG.BASE_URL.replace('/api', '')}${mainImage.file_path}`;

        return `
            <div class="gallery-main">
                <img src="${imageUrl}" alt="Main image" id="mainGalleryImage">
            </div>
            ${images.length > 1 ? `
                <div class="gallery-thumbnails">
                    ${images.map((img, index) => `
                        <div class="gallery-thumbnail ${index === 0 ? 'active' : ''}" 
                             onclick="changeMainImage('${API_CONFIG.BASE_URL.replace('/api', '')}${img.file_path}', this)">
                            <img src="${API_CONFIG.BASE_URL.replace('/api', '')}${img.file_path}" alt="Thumbnail">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    renderDocuments(documents) {
        return `
            <div class="documents-list">
                <h4>Documents</h4>
                ${documents.map(doc => `
                    <div class="document-item">
                        <span class="document-icon">📄</span>
                        <span>${this.escapeHtml(doc.name)}</span>
                        ${doc.is_verified ? '<span class="document-verified">✅ Verified</span>' : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    getListingFeatures(listing) {
        const features = [];
        
        features.push(this.capitalizeFirst(listing.land_type));
        
        if (listing.has_road_access) features.push('Road Access');
        if (listing.has_electricity) features.push('Electricity');
        if (listing.has_water) features.push('Water');
        if (listing.near_school) features.push('Near School');
        if (listing.near_hospital) features.push('Near Hospital');
        if (listing.near_market) features.push('Near Market');
        
        return features;
    }

    getFullLocation(listing) {
        return `${listing.village}, ${listing.cell}, ${listing.sector}, ${listing.district}`;
    }

    formatPrice(amount, currency = 'RWF') {
        const symbol = APP_CONFIG.CURRENCY.SYMBOLS[currency] || currency;
        return `${this.formatNumber(amount)} ${symbol}`;
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for button clicks
window.viewListing = (id) => {
    if (window.listingsManager) {
        window.listingsManager.viewListing(id);
    }
};

window.searchListings = () => {
    if (window.listingsManager) {
        window.listingsManager.handleSearch();
    }
};

window.inquireAboutListing = (listingId, listingTitle = '') => {
    // Set the listing ID in the inquiry form
    const inquiryListingId = document.getElementById('inquiryListingId');
    if (inquiryListingId) {
        inquiryListingId.value = listingId;
    }
    
    // Pre-fill the message with listing reference
    const inquiryMessage = document.getElementById('inquiryMessage');
    if (inquiryMessage && listingTitle) {
        inquiryMessage.value = `I am interested in the plot: "${listingTitle}". Please provide more information.`;
    }
    
    showModal('inquiryModal');
};

window.changeMainImage = (src, thumbnail) => {
    const mainImage = document.getElementById('mainGalleryImage');
    if (mainImage) {
        mainImage.src = src;
    }
    
    // Update active thumbnail
    document.querySelectorAll('.gallery-thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnail.classList.add('active');
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.listingsManager = new ListingsManager();
});