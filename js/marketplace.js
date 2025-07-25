/**
 * Marketplace JavaScript
 * Handles product filtering, sorting, comparison, AI recommendations, and enhanced user interactions
 */

(function($) {
    'use strict';

    // Marketplace Object
    window.Marketplace = {
        // State management
        state: {
            products: [],
            filteredProducts: [],
            currentView: 'grid',
            currentSort: 'price-low',
            filters: {
                search: '',
                farmSize: [],
                priceRange: { min: 0, max: 5000 },
                powerOutput: '',
                applications: [],
                financing: []
            },
            comparison: [],
            wishlist: JSON.parse(localStorage.getItem('marketplace_wishlist') || '[]'),
            cart: JSON.parse(localStorage.getItem('marketplace_cart') || '[]')
        },

        // Product data (in a real app, this would come from an API)
        productDatabase: [
            {
                id: 'small-kit',
                name: 'Small Farm Solar Kit',
                price: 299,
                monthlyPrice: 25,
                power: 500,
                battery: '200Ah',
                coverage: '1-5 acres',
                category: ['small', 'irrigation', 'lighting'],
                rating: 4.8,
                reviews: 234,
                image: 'img/solar-kit-small.jpg',
                description: 'Perfect starter kit for 1-5 acre farms. Includes 500W panels, battery storage, and irrigation pump compatibility.',
                specs: {
                    'Solar Panels': '2x 250W Monocrystalline',
                    'Battery': '200Ah Lithium',
                    'Inverter': '1000W Pure Sine Wave',
                    'Charge Controller': '30A MPPT',
                    'Warranty': '5 years'
                },
                financing: ['paygo', 'installment'],
                badges: ['Best Seller', 'Financing Available'],
                suitableFor: ['maize', 'vegetables', 'fruits'],
                roi: 18 // months
            },
            {
                id: 'medium-kit',
                name: 'Medium Farm Solar Kit',
                price: 799,
                monthlyPrice: 65,
                power: 1500,
                battery: '600Ah',
                coverage: '6-15 acres',
                category: ['medium', 'irrigation', 'cooling', 'processing'],
                rating: 4.9,
                reviews: 189,
                image: 'img/solar-kit-medium.jpg',
                description: 'Comprehensive solution for 6-15 acre farms. Includes cooling systems, multiple pumps, and smart monitoring.',
                specs: {
                    'Solar Panels': '6x 250W Monocrystalline',
                    'Battery': '600Ah Lithium',
                    'Inverter': '3000W Pure Sine Wave',
                    'Charge Controller': '60A MPPT',
                    'Warranty': '7 years'
                },
                financing: ['paygo', 'installment', 'lease'],
                badges: ['Most Popular', 'Financing Available'],
                suitableFor: ['rice', 'maize', 'vegetables', 'mixed'],
                roi: 24
            },
            {
                id: 'large-kit',
                name: 'Commercial Farm Solar Kit',
                price: 1999,
                monthlyPrice: 150,
                power: 5000,
                battery: '1200Ah',
                coverage: '15+ acres',
                category: ['large', 'irrigation', 'cooling', 'processing', 'lighting'],
                rating: 4.7,
                reviews: 98,
                image: 'img/solar-kit-large.jpg',
                description: 'Complete energy independence for large operations. Industrial-grade components with IoT monitoring and backup systems.',
                specs: {
                    'Solar Panels': '20x 250W Monocrystalline',
                    'Battery': '1200Ah Lithium',
                    'Inverter': '8000W Pure Sine Wave',
                    'Charge Controller': '100A MPPT',
                    'Warranty': '10 years'
                },
                financing: ['installment', 'lease'],
                badges: ['Enterprise', 'Financing Available'],
                suitableFor: ['all'],
                roi: 36
            },
            {
                id: 'irrigation-kit',
                name: 'Solar Irrigation Pump Kit',
                price: 399,
                monthlyPrice: 35,
                power: 750,
                flowRate: '2000L/hr',
                head: '50m',
                coverage: '3-10 acres',
                category: ['small', 'medium', 'irrigation'],
                rating: 4.3,
                reviews: 156,
                image: 'img/irrigation-pump-kit.jpg',
                description: 'Dedicated irrigation solution with submersible pump, drip irrigation compatibility, and smart water management.',
                specs: {
                    'Solar Panels': '3x 250W Monocrystalline',
                    'Pump': 'Submersible 1HP',
                    'Controller': 'Smart Water Management',
                    'Pipes': '100m included',
                    'Warranty': '3 years'
                },
                financing: ['paygo', 'installment'],
                badges: ['Water Efficient'],
                suitableFor: ['maize', 'rice', 'vegetables'],
                roi: 15
            },
            {
                id: 'lighting-kit',
                name: 'Solar Farm Lighting Kit',
                price: 199,
                monthlyPrice: 18,
                power: 300,
                lights: '8 LED',
                runtime: '12 hours',
                coverage: '2 acres',
                category: ['small', 'medium', 'lighting'],
                rating: 4.2,
                reviews: 89,
                image: 'img/solar-lighting-kit.jpg',
                description: 'Complete lighting solution with LED fixtures, motion sensors, and timer controls for enhanced farm security.',
                specs: {
                    'Solar Panel': '300W Monocrystalline',
                    'Lights': '8x 20W LED',
                    'Battery': '100Ah Lithium',
                    'Motion Sensors': '4 units',
                    'Warranty': '2 years'
                },
                financing: ['paygo'],
                badges: ['Energy Saver'],
                suitableFor: ['all'],
                roi: 12
            },
            {
                id: 'cooling-kit',
                name: 'Solar Cold Storage Kit',
                price: 1299,
                monthlyPrice: 110,
                power: 2000,
                capacity: '500kg',
                temperature: '2-8°C',
                coverage: 'Post-harvest',
                category: ['medium', 'large', 'cooling', 'processing'],
                rating: 4.6,
                reviews: 67,
                image: 'img/solar-cooling-kit.jpg',
                description: 'Preserve your harvest with solar-powered refrigeration. Reduces post-harvest losses by up to 90%.',
                specs: {
                    'Solar Panels': '8x 250W Monocrystalline',
                    'Refrigeration': 'Cold Room 500kg',
                    'Battery': '800Ah Lithium',
                    'Temperature Range': '2-8°C',
                    'Warranty': '5 years'
                },
                financing: ['installment', 'lease'],
                badges: ['Post-Harvest', 'ROI Focused'],
                suitableFor: ['vegetables', 'fruits'],
                roi: 30
            }
        ],

        // Initialize marketplace
        init: function() {
            this.state.products = this.productDatabase;
            this.state.filteredProducts = [...this.productDatabase];
            
            this.bindEvents();
            this.renderProducts();
            this.updateProductCount();
            this.setupFloatingElements();
            this.loadSavedState();

            console.log('🛒 Marketplace initialized with', this.state.products.length, 'products');
        },

        // Bind all event handlers
        bindEvents: function() {
            // Search functionality
            $('#productSearch').on('input', this.utils.debounce((e) => {
                this.state.filters.search = e.target.value;
                this.applyFilters();
            }, 300));

            // Filter checkboxes
            $('.filter-sidebar input[type="checkbox"]').on('change', () => {
                this.updateFiltersFromUI();
                this.applyFilters();
            });

            // Price range
            $('#priceRange').on('input', (e) => {
                const value = parseInt(e.target.value);
                this.state.filters.priceRange.max = value;
                $('#priceMax').val(value === 5000 ? '' : value);
                this.applyFilters();
            });

            $('#priceMin, #priceMax').on('input', this.utils.debounce(() => {
                this.state.filters.priceRange.min = parseInt($('#priceMin').val()) || 0;
                this.state.filters.priceRange.max = parseInt($('#priceMax').val()) || 5000;
                this.applyFilters();
            }, 300));

            // Power output filter
            $('#powerFilter').on('change', (e) => {
                this.state.filters.powerOutput = e.target.value;
                this.applyFilters();
            });

            // Sort dropdown
            $('.dropdown-menu [data-sort]').on('click', (e) => {
                e.preventDefault();
                this.state.currentSort = $(e.target).data('sort');
                this.applySorting();
                
                // Update dropdown text
                const sortText = $(e.target).text();
                $('.dropdown-toggle').html(`<i class="fas fa-sort me-2"></i>Sort by: ${sortText}`);
            });

            // View toggle
            $('[data-view]').on('click', (e) => {
                const view = $(e.target).data('view');
                this.setView(view);
            });

            // AI recommendation form
            $('#recommendationForm').on('submit', (e) => {
                e.preventDefault();
                this.generateAIRecommendations();
            });

            // Floating compare button
            $(document).on('click', '.floating-compare', () => {
                this.showComparison();
            });

            // Window scroll for floating elements
            $(window).on('scroll', this.utils.throttle(() => {
                this.updateFloatingElements();
            }, 100));
        },

        // Update filters from UI elements
        updateFiltersFromUI: function() {
            // Farm size
            this.state.filters.farmSize = [];
            $('.filter-sidebar input[id^="farm"]:checked').each(function() {
                Marketplace.state.filters.farmSize.push($(this).val());
            });

            // Applications
            this.state.filters.applications = [];
            $('.filter-sidebar input[id^="app"]:checked').each(function() {
                Marketplace.state.filters.applications.push($(this).val());
            });

            // Financing
            this.state.filters.financing = [];
            $('.filter-sidebar input[id^="fin"]:checked').each(function() {
                Marketplace.state.filters.financing.push($(this).val());
            });
        },

        // Apply all filters
        applyFilters: function() {
            this.state.filteredProducts = this.state.products.filter(product => {
                // Search filter
                if (this.state.filters.search) {
                    const searchTerm = this.state.filters.search.toLowerCase();
                    const searchableText = `${product.name} ${product.description} ${Object.values(product.specs).join(' ')}`.toLowerCase();
                    if (!searchableText.includes(searchTerm)) return false;
                }

                // Price range filter
                if (product.price < this.state.filters.priceRange.min || 
                    product.price > this.state.filters.priceRange.max) {
                    return false;
                }

                // Farm size filter
                if (this.state.filters.farmSize.length > 0) {
                    const hasMatchingSize = this.state.filters.farmSize.some(size => 
                        product.category.includes(size));
                    if (!hasMatchingSize) return false;
                }

                // Power output filter
                if (this.state.filters.powerOutput) {
                    const [min, max] = this.state.filters.powerOutput.split('-').map(v => 
                        v.includes('+') ? Infinity : parseInt(v));
                    if (product.power < min || (max !== Infinity && product.power > max)) {
                        return false;
                    }
                }

                // Applications filter
                if (this.state.filters.applications.length > 0) {
                    const hasMatchingApp = this.state.filters.applications.some(app => 
                        product.category.includes(app));
                    if (!hasMatchingApp) return false;
                }

                // Financing filter
                if (this.state.filters.financing.length > 0) {
                    const hasMatchingFinancing = this.state.filters.financing.some(fin => 
                        product.financing.includes(fin));
                    if (!hasMatchingFinancing) return false;
                }

                return true;
            });

            this.applySorting();
            this.renderProducts();
            this.updateProductCount();
        },

        // Apply sorting
        applySorting: function() {
            this.state.filteredProducts.sort((a, b) => {
                switch (this.state.currentSort) {
                    case 'price-low':
                        return a.price - b.price;
                    case 'price-high':
                        return b.price - a.price;
                    case 'power':
                        return b.power - a.power;
                    case 'rating':
                        return b.rating - a.rating;
                    case 'newest':
                        return b.id.localeCompare(a.id); // Simplified
                    default:
                        return 0;
                }
            });
        },

        // Set view (grid/list)
        setView: function(view) {
            this.state.currentView = view;
            
            // Update button states
            $('[data-view]').removeClass('active');
            $(`[data-view="${view}"]`).addClass('active');
            
            // Update grid class
            $('#productsGrid').removeClass('products-grid-view products-list-view')
                .addClass(`products-${view}-view`);
            
            this.renderProducts();
        },

        // Render products
        renderProducts: function() {
            const container = $('#productsGrid');
            
            if (this.state.filteredProducts.length === 0) {
                container.html(`
                    <div class="col-12">
                        <div class="no-products">
                            <i class="fas fa-search"></i>
                            <h3>No products found</h3>
                            <p>Try adjusting your filters or search terms</p>
                            <button class="btn btn-success" onclick="clearFilters()">Clear All Filters</button>
                        </div>
                    </div>
                `);
                return;
            }

            const productHTML = this.state.filteredProducts.map(product => 
                this.generateProductHTML(product)).join('');
            
            container.html(productHTML);
            
            // Add animation
            if (!FarmersFriend.utils.prefersReducedMotion()) {
                container.find('.product-item').addClass('fade-in');
            }
        },

        // Generate product HTML
        generateProductHTML: function(product) {
            const isInComparison = this.state.comparison.includes(product.id);
            const isInWishlist = this.state.wishlist.includes(product.id);
            const starsHTML = this.generateStarsHTML(product.rating);
            const badgesHTML = product.badges.map(badge => {
                const badgeClass = badge === 'Best Seller' ? 'bg-success' : 
                                 badge === 'Most Popular' ? 'bg-primary' : 
                                 badge === 'Enterprise' ? 'bg-info' : 
                                 badge === 'Financing Available' ? 'bg-warning text-dark' : 'bg-secondary';
                return `<span class="badge ${badgeClass}">${badge}</span>`;
            }).join('');

            const colClass = this.state.currentView === 'list' ? 'col-12' : 'col-lg-4 col-md-6';

            return `
                <div class="${colClass} product-item" data-category="${product.category.join(' ')}" 
                     data-price="${product.price}" data-power="${product.power}">
                    <div class="product-card h-100">
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.name}" class="img-fluid">
                            <div class="product-badges">
                                ${badgesHTML}
                            </div>
                            <div class="product-actions">
                                <button class="btn btn-light btn-sm ${isInComparison ? 'active' : ''}" 
                                        onclick="toggleComparison('${product.id}')" 
                                        title="Add to comparison">
                                    <i class="fas fa-balance-scale"></i>
                                </button>
                                <button class="btn btn-light btn-sm ${isInWishlist ? 'active text-danger' : ''}" 
                                        onclick="toggleWishlist('${product.id}')" 
                                        title="Add to wishlist">
                                    <i class="fas fa-heart"></i>
                                </button>
                            </div>
                        </div>
                        <div class="product-details p-4">
                            <h5 class="product-title">${product.name}</h5>
                            <p class="product-description">${product.description}</p>
                            
                            <div class="product-specs mb-3">
                                <div class="spec-item">
                                    <span class="spec-label">Power:</span>
                                    <span class="spec-value">${product.power}W</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label">${product.battery ? 'Battery:' : 'Flow Rate:'}</span>
                                    <span class="spec-value">${product.battery || product.flowRate}</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label">Coverage:</span>
                                    <span class="spec-value">${product.coverage}</span>
                                </div>
                            </div>

                            <div class="product-rating mb-2">
                                <div class="stars">${starsHTML}</div>
                                <span class="rating-text">(${product.rating}/5 - ${product.reviews} reviews)</span>
                            </div>

                            <div class="product-pricing mb-3">
                                <div class="price-main">$${product.price.toLocaleString()}</div>
                                <div class="price-financing">or $${product.monthlyPrice}/month</div>
                            </div>

                            <div class="product-buttons">
                                <a href="product-details.html?id=${product.id}" 
                                   class="btn btn-outline-success flex-fill me-2">
                                    View Details
                                </a>
                                <button class="btn btn-success flex-fill" onclick="addToCart('${product.id}')">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // Generate stars HTML
        generateStarsHTML: function(rating) {
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    stars += '<i class="fas fa-star text-warning"></i>';
                } else if (i - rating < 1) {
                    stars += '<i class="fas fa-star-half-alt text-warning"></i>';
                } else {
                    stars += '<i class="far fa-star text-warning"></i>';
                }
            }
            return stars;
        },

        // Update product count
        updateProductCount: function() {
            $('#productCount').text(this.state.filteredProducts.length);
        },

        // Generate AI recommendations
        generateAIRecommendations: function() {
            const formData = new FormData(document.getElementById('recommendationForm'));
            const preferences = {
                farmSize: formData.get('farmSize'),
                cropType: formData.get('cropType'),
                budget: formData.get('budget'),
                priority: formData.get('priority'),
                requirements: formData.getAll('requirements')
            };

            // Simulate AI recommendation logic
            const recommendations = this.calculateRecommendations(preferences);
            this.displayRecommendations(recommendations);
        },

        // Calculate recommendations based on preferences
        calculateRecommendations: function(preferences) {
            return this.state.products.map(product => {
                let score = 0;
                let reasons = [];

                // Farm size compatibility
                if (preferences.farmSize && product.category.includes(preferences.farmSize.split('-')[0] === '1' ? 'small' : 
                    preferences.farmSize.split('-')[0] === '6' ? 'medium' : 'large')) {
                    score += 25;
                    reasons.push('Perfect fit for your farm size');
                }

                // Crop type compatibility
                if (preferences.cropType && (product.suitableFor.includes(preferences.cropType) || 
                    product.suitableFor.includes('all'))) {
                    score += 20;
                    reasons.push(`Optimized for ${preferences.cropType} farming`);
                }

                // Budget compatibility
                if (preferences.budget) {
                    const [budgetMin, budgetMax] = preferences.budget.split('-').map(v => 
                        parseInt(v.replace(/[^0-9]/g, '')) || (v.includes('+') ? Infinity : 0));
                    if (product.price >= budgetMin && product.price <= (budgetMax || Infinity)) {
                        score += 20;
                        reasons.push('Within your budget range');
                    }
                }

                // Priority matching
                if (preferences.priority && product.category.includes(preferences.priority)) {
                    score += 15;
                    reasons.push(`Addresses your priority: ${preferences.priority}`);
                }

                // Requirements matching
                preferences.requirements.forEach(req => {
                    if ((req === 'backup' && product.battery) ||
                        (req === 'monitoring' && product.price > 500) ||
                        (req === 'expandable' && product.category.includes('medium')) ||
                        (req === 'warranty' && product.specs.Warranty)) {
                        score += 5;
                        reasons.push(`Includes ${req} feature`);
                    }
                });

                // Rating bonus
                score += product.rating * 2;

                // ROI bonus
                if (product.roi) {
                    score += Math.max(0, 20 - product.roi); // Lower ROI = higher score
                    if (product.roi <= 18) {
                        reasons.push('Excellent return on investment');
                    }
                }

                return {
                    product,
                    score: Math.min(100, score),
                    reasons: reasons.slice(0, 3) // Top 3 reasons
                };
            }).sort((a, b) => b.score - a.score).slice(0, 3); // Top 3 products
        },

        // Display AI recommendations
        displayRecommendations: function(recommendations) {
            const resultsContainer = $('#recommendationResults');
            
            const recommendationsHTML = recommendations.map((rec, index) => `
                <div class="recommendation-card">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="mb-0">${rec.product.name}</h6>
                        <span class="recommendation-score">${rec.score}% Match</span>
                    </div>
                    <p class="mb-2">${rec.product.description}</p>
                    <div class="recommendation-reason">
                        <strong>Why this is recommended:</strong>
                        <ul class="mb-2 ps-3">
                            ${rec.reasons.map(reason => `<li>${reason}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong class="text-success">$${rec.product.price}</strong>
                            <small class="text-muted">($${rec.product.monthlyPrice}/month)</small>
                        </div>
                        <div>
                            <a href="product-details.html?id=${rec.product.id}" class="btn btn-sm btn-outline-success me-2">
                                View Details
                            </a>
                            <button class="btn btn-sm btn-success" onclick="addToCart('${rec.product.id}')">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            resultsContainer.html(recommendationsHTML).show();
            
            // Hide form and show results
            $('#recommendationForm').hide();
        },

        // Toggle product comparison
        toggleComparison: function(productId) {
            const index = this.state.comparison.indexOf(productId);
            if (index > -1) {
                this.state.comparison.splice(index, 1);
            } else {
                if (this.state.comparison.length >= 4) {
                    FarmersFriend.showToast('You can compare up to 4 products at a time', 'warning');
                    return;
                }
                this.state.comparison.push(productId);
            }
            
            this.updateComparisonUI();
            this.saveState();
        },

        // Update comparison UI elements
        updateComparisonUI: function() {
            // Update floating compare button
            const floatingCompare = $('.floating-compare');
            if (this.state.comparison.length > 0) {
                floatingCompare.show();
                floatingCompare.find('.compare-count').text(this.state.comparison.length);
            } else {
                floatingCompare.hide();
            }

            // Update product action buttons
            $('.product-actions button[onclick^="toggleComparison"]').each(function() {
                const productId = $(this).attr('onclick').match(/toggleComparison\('(.+?)'\)/)[1];
                $(this).toggleClass('active', Marketplace.state.comparison.includes(productId));
            });
        },

        // Show product comparison
        showComparison: function() {
            if (this.state.comparison.length === 0) return;

            const comparisonSection = $('#comparison-section');
            const comparisonTable = $('#comparisonTable');
            
            const products = this.state.comparison.map(id => 
                this.state.products.find(p => p.id === id)).filter(Boolean);

            const tableHTML = this.generateComparisonTable(products);
            comparisonTable.html(tableHTML);
            comparisonSection.show();
            
            // Scroll to comparison
            $('html, body').animate({
                scrollTop: comparisonSection.offset().top - 100
            }, 500);
        },

        // Generate comparison table
        generateComparisonTable: function(products) {
            const features = ['Image', 'Name', 'Price', 'Power', 'Battery/Flow', 'Coverage', 'Rating', 'Warranty', 'Actions'];
            
            let tableHTML = '<table class="table comparison-table">';
            
            // Header row
            tableHTML += '<thead><tr><th>Features</th>';
            products.forEach(product => {
                tableHTML += `<th>${product.name}</th>`;
            });
            tableHTML += '</tr></thead><tbody>';

            // Feature rows
            features.forEach(feature => {
                tableHTML += '<tr>';
                tableHTML += `<td class="fw-bold">${feature}</td>`;
                
                products.forEach(product => {
                    let value = '';
                    switch(feature) {
                        case 'Image':
                            value = `<img src="${product.image}" alt="${product.name}" class="product-image-small">`;
                            break;
                        case 'Name':
                            value = product.name;
                            break;
                        case 'Price':
                            value = `$${product.price}<br><small>$${product.monthlyPrice}/month</small>`;
                            break;
                        case 'Power':
                            value = `${product.power}W`;
                            break;
                        case 'Battery/Flow':
                            value = product.battery || product.flowRate || 'N/A';
                            break;
                        case 'Coverage':
                            value = product.coverage;
                            break;
                        case 'Rating':
                            value = `${product.rating}/5 ⭐<br><small>(${product.reviews} reviews)</small>`;
                            break;
                        case 'Warranty':
                            value = product.specs.Warranty || 'N/A';
                            break;
                        case 'Actions':
                            value = `
                                <button class="btn btn-sm btn-success mb-1 w-100" onclick="addToCart('${product.id}')">
                                    Add to Cart
                                </button>
                                <button class="btn btn-sm btn-outline-danger w-100" onclick="removeFromComparison('${product.id}')">
                                    Remove
                                </button>
                            `;
                            break;
                    }
                    tableHTML += `<td>${value}</td>`;
                });
                
                tableHTML += '</tr>';
            });

            tableHTML += '</tbody></table>';
            return tableHTML;
        },

        // Setup floating elements
        setupFloatingElements: function() {
            // Create floating compare button
            if ($('.floating-compare').length === 0) {
                $('body').append(`
                    <div class="floating-compare">
                        <button class="btn btn-primary">
                            <i class="fas fa-balance-scale me-2"></i>Compare
                            <span class="compare-count">0</span>
                        </button>
                    </div>
                `);
            }

            // Create mobile quick actions (if needed)
            if (window.innerWidth <= 991 && $('.quick-actions-mobile').length === 0) {
                $('body').append(`
                    <div class="quick-actions-mobile">
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-success flex-fill" data-bs-toggle="modal" data-bs-target="#recommendationModal">
                                <i class="fas fa-robot me-1"></i>AI Recommend
                            </button>
                            <button class="btn btn-success flex-fill" onclick="scrollToComparison()">
                                <i class="fas fa-balance-scale me-1"></i>Compare (<span class="compare-count">0</span>)
                            </button>
                        </div>
                    </div>
                `);
            }
        },

        // Update floating elements on scroll
        updateFloatingElements: function() {
            const scrollTop = $(window).scrollTop();
            const compareSection = $('#comparison-section');
            
            // Show/hide floating compare based on scroll position
            if (this.state.comparison.length > 0) {
                if (compareSection.length && scrollTop > compareSection.offset().top - 200) {
                    $('.floating-compare').fadeOut();
                } else {
                    $('.floating-compare').fadeIn();
                }
            }
        },

        // Save state to localStorage
        saveState: function() {
            localStorage.setItem('marketplace_comparison', JSON.stringify(this.state.comparison));
            localStorage.setItem('marketplace_wishlist', JSON.stringify(this.state.wishlist));
            localStorage.setItem('marketplace_cart', JSON.stringify(this.state.cart));
        },

        // Load saved state
        loadSavedState: function() {
            const savedComparison = localStorage.getItem('marketplace_comparison');
            if (savedComparison) {
                this.state.comparison = JSON.parse(savedComparison);
                this.updateComparisonUI();
            }
        },

        // Utility functions
        utils: {
            debounce: function(func, delay) {
                let timeoutId;
                return function(...args) {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => func.apply(this, args), delay);
                };
            },

            throttle: function(func, delay) {
                let timeoutId;
                let lastExecTime = 0;
                return function(...args) {
                    const currentTime = Date.now();
                    
                    if (currentTime - lastExecTime > delay) {
                        func.apply(this, args);
                        lastExecTime = currentTime;
                    } else {
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(() => {
                            func.apply(this, args);
                            lastExecTime = Date.now();
                        }, delay - (currentTime - lastExecTime));
                    }
                };
            }
        }
    };

    // Global functions for inline event handlers
    window.clearFilters = function() {
        // Reset all filter inputs
        $('.filter-sidebar input[type="checkbox"]').prop('checked', false);
        $('.filter-sidebar input[type="number"]').val('');
        $('.filter-sidebar select').val('');
        $('#productSearch').val('');
        $('#priceRange').val(5000);
        
        // Reset state
        Marketplace.state.filters = {
            search: '',
            farmSize: [],
            priceRange: { min: 0, max: 5000 },
            powerOutput: '',
            applications: [],
            financing: []
        };
        
        Marketplace.applyFilters();
    };

    window.toggleComparison = function(productId) {
        Marketplace.toggleComparison(productId);
    };

    window.removeFromComparison = function(productId) {
        Marketplace.toggleComparison(productId); // Same function handles both
        Marketplace.showComparison(); // Refresh the comparison view
    };

    window.toggleWishlist = function(productId) {
        const index = Marketplace.state.wishlist.indexOf(productId);
        if (index > -1) {
            Marketplace.state.wishlist.splice(index, 1);
            FarmersFriend.showToast('Removed from wishlist', 'info');
        } else {
            Marketplace.state.wishlist.push(productId);
            FarmersFriend.showToast('Added to wishlist', 'success');
        }
        
        // Update UI
        $(`button[onclick="toggleWishlist('${productId}')"]`)
            .toggleClass('active text-danger', Marketplace.state.wishlist.includes(productId));
        
        Marketplace.saveState();
    };

    window.addToCart = function(productId) {
        const product = Marketplace.state.products.find(p => p.id === productId);
        if (product) {
            Marketplace.state.cart.push(productId);
            Marketplace.saveState();
            FarmersFriend.showToast(`${product.name} added to cart!`, 'success');
        }
    };

    window.scrollToComparison = function() {
        if (Marketplace.state.comparison.length === 0) {
            FarmersFriend.showToast('Add products to comparison first', 'warning');
            return;
        }
        Marketplace.showComparison();
    };

    // Initialize when document is ready
    $(document).ready(() => {
        Marketplace.init();
    });

})(jQuery);