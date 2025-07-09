 // Sample listing data
        const sampleListings = [
            {
                id: 1,
                title: "Prime Residential Plot",
                location: "Nyamata, Bugesera",
                price: "8,500,000 RWF",
                size: "800 sqm",
                features: ["Residential", "Water Access", "Road Access", "Title Deed"],
                description: "Beautiful residential plot in a developing area with excellent road access and utilities nearby.",
                verified: true,
                images: ["plot1.jpg"],
                documents: ["title_deed.pdf"]
            },
            {
                id: 2,
                title: "Commercial Land Opportunity",
                location: "Rilima, Bugesera",
                price: "15,000,000 RWF",
                size: "1,200 sqm",
                features: ["Commercial", "Main Road", "Electricity", "Title Deed"],
                description: "Excellent commercial plot on main road, perfect for business development.",
                verified: true,
                images: ["plot2.jpg"],
                documents: ["title_deed.pdf", "survey_report.pdf"]
            },
            {
                id: 3,
                title: "Agricultural Land",
                location: "Kamabuye, Bugesera",
                price: "12,000,000 RWF",
                size: "2,000 sqm",
                features: ["Agricultural", "Fertile Soil", "Water Source", "Title Deed"],
                description: "Fertile agricultural land with water access, perfect for farming or future development.",
                verified: true,
                images: ["plot3.jpg"],
                documents: ["title_deed.pdf"]
            }
        ];

        // Populate listings
        function populateListings(listings = sampleListings) {
            const grid = document.getElementById('listingsGrid');
            grid.innerHTML = '';

            listings.forEach(listing => {
                const listingCard = document.createElement('div');
                listingCard.className = 'listing-card';
                listingCard.innerHTML = `
                    <div class="listing-image">
                        🏞️
                        <div class="verified-badge">✅ Verified</div>
                    </div>
                    <div class="listing-content">
                        <h3 class="listing-title">${listing.title}</h3>
                        <div class="listing-location">${listing.location}</div>
                        <div class="listing-details">
                            <div class="listing-price">${listing.price}</div>
                            <div class="listing-size">${listing.size}</div>
                        </div>
                        <div class="listing-features">
                            ${listing.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                        </div>
                        <div class="listing-actions">
                            <button class="btn btn-outline btn-small" onclick="viewListing(${listing.id})">View Details</button>
                            <button class="btn btn-primary btn-small" onclick="reservePlot(${listing.id})">Reserve Plot</button>
                        </div>
                    </div>
                `;
                grid.appendChild(listingCard);
            });
        }

        // Search functionality
        function searchListings() {
            const location = document.getElementById('searchLocation').value.toLowerCase();
            const priceRange = document.getElementById('priceRange').value;
            const landSize = document.getElementById('landSize').value;

            let filteredListings = sampleListings;

            if (location) {
                filteredListings = filteredListings.filter(listing => 
                    listing.location.toLowerCase().includes(location)
                );
            }

            // Add price and size filtering logic here
            populateListings(filteredListings);
        }

        // Modal functions
        function showModal(modalId) {
            document.getElementById(modalId).style.display = 'block';
        }

        function hideModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        // View listing details
        function viewListing(id) {
            const listing = sampleListings.find(l => l.id === id);
            if (listing) {
                document.getElementById('listingModalTitle').textContent = listing.title;
                document.getElementById('listingModalContent').innerHTML = `
                    <div class="listing-image" style="height: 250px; margin-bottom: 1rem;">
                        🏞️
                        <div class="verified-badge">✅ Verified</div>
                    </div>
                    <h3>${listing.title}</h3>
                    <p><strong>Location:</strong> ${listing.location}</p>
                    <p><strong>Price:</strong> ${listing.price}</p>
                    <p><strong>Size:</strong> ${listing.size}</p>
                    <p><strong>Description:</strong> ${listing.description}</p>
                    <div style="margin: 1rem 0;">
                        <strong>Features:</strong>
                        <div class="listing-features">
                            ${listing.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                        </div>
                    </div>
                    <div style="margin: 1rem 0;">
                        <strong>Documents:</strong>
                        <ul>
                            ${listing.documents.map(doc => `<li>📄 ${doc}</li>`).join('')}
                        </ul>
                    </div>
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-primary" onclick="reservePlot(${listing.id})">Reserve This Plot</button>
                        <button class="btn btn-outline" onclick="hideModal('listingDetailsModal'); showModal('inquiryModal')">Send Inquiry</button>
                    </div>
                `;
                showModal('listingDetailsModal');
            }
        }

        // Reserve plot
        function reservePlot(id) {
            const listing = sampleListings.find(l => l.id === id);
            if (listing) {
                alert(`Reservation request for "${listing.title}" has been sent to the broker. You will receive a confirmation email shortly.`);
                // In a real app, this would send data to the backend
            }
        }

        // Handle login
        function handleLogin(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // In a real app, this would authenticate with the backend
            alert('Login functionality will be implemented in the backend. For demo purposes, this shows the UI.');
            hideModal('loginModal');
        }

        // Handle inquiry
        function handleInquiry(event) {
            event.preventDefault();
            const name = document.getElementById('inquiryName').value;
            const email = document.getElementById('inquiryEmail').value;
            const phone = document.getElementById('inquiryPhone').value;
            const message = document.getElementById('inquiryMessage').value;
            
            // In a real app, this would send data to the backend
            alert(`Thank you ${name}! Your inquiry has been sent to the broker. You will receive a response within 24 hours.`);
            hideModal('inquiryModal');
            
            // Reset form
            event.target.reset();
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modals = document.getElementsByClassName('modal');
            for (let modal of modals) {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            }
        }

        // Handle contact form
        function handleContactForm(event) {
            event.preventDefault();
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const phone = document.getElementById('contactPhone').value;
            const subject = document.getElementById('contactSubject').value;
            const message = document.getElementById('contactMessage').value;
            
            // In a real app, this would send data to the backend
            alert(`Thank you ${name}! Your message has been sent successfully. We'll get back to you within 24 hours.`);
            
            // Reset form
            event.target.reset();
        }

        // Smooth scrolling for navigation links
        function smoothScrollTo(elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }

        // Handle navigation clicks
        document.addEventListener('DOMContentLoaded', function() {
            // Add click listeners to navigation links
            const navLinks = document.querySelectorAll('nav a[href^="#"]');
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href').substring(1);
                    smoothScrollTo(targetId);
                });
            });
            
            populateListings();
        });