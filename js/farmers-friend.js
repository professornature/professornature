/**
 * Farmers Friend Solar Systems - Main JavaScript
 * Handles solar calculator, offline functionality, language support, and accessibility
 */

(function($) {
    'use strict';

    // Global App Object
    window.FarmersFriend = {
        // Configuration
        config: {
            apiUrl: '/api',
            supportedLanguages: ['en', 'tw', 'fr', 'ha'],
            offlineStorageKey: 'farmersFriend_offline_data',
            currentLanguage: localStorage.getItem('farmersFriend_language') || 'en'
        },

        // Language translations
        translations: {
            en: {
                calculatorTitle: "Calculate Your Solar Savings",
                monthlySavings: "Monthly Savings",
                yearlySavings: "Yearly Savings",
                paybackPeriod: "Payback Period",
                getQuote: "Get Your Custom Quote",
                offlineMode: "You are currently offline. Some features may be limited.",
                connectionRestored: "Connection restored!"
            },
            tw: {
                calculatorTitle: "Bu wo solar ho nkwagye",
                monthlySavings: "Bosome biara nkwagye",
                yearlySavings: "Afe biara nkwagye",
                paybackPeriod: "Sika san bere",
                getQuote: "Nya wo ankasa bo",
                offlineMode: "Wo nni intanɛt mprempren. Nneɛma bi rentumi nyɛ adwuma.",
                connectionRestored: "Intanɛt aba bio!"
            },
            fr: {
                calculatorTitle: "Calculez vos économies solaires",
                monthlySavings: "Économies mensuelles",
                yearlySavings: "Économies annuelles",
                paybackPeriod: "Période de récupération",
                getQuote: "Obtenez votre devis personnalisé",
                offlineMode: "Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.",
                connectionRestored: "Connexion rétablie!"
            },
            ha: {
                calculatorTitle: "Lissafa kudin solar da za ku adana",
                monthlySavings: "Adanin kowane wata",
                yearlySavings: "Adanin kowane shekara",
                paybackPeriod: "Lokacin dawo da kudi",
                getQuote: "Samu kimanin ku na musamman",
                offlineMode: "Yanzu ba ku da intanet. Wasu abubuwa ba za su iya aiki ba.",
                connectionRestored: "Intanet ya dawo!"
            }
        },

        // Utility functions
        utils: {
            // Format currency
            formatCurrency: function(amount, currency = 'USD') {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency
                }).format(amount);
            },

            // Get translated text
            t: function(key) {
                const lang = FarmersFriend.config.currentLanguage;
                return FarmersFriend.translations[lang][key] || FarmersFriend.translations.en[key] || key;
            },

            // Save to local storage
            saveToStorage: function(key, data) {
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                    return true;
                } catch (e) {
                    console.warn('Failed to save to localStorage:', e);
                    return false;
                }
            },

            // Load from local storage
            loadFromStorage: function(key) {
                try {
                    const data = localStorage.getItem(key);
                    return data ? JSON.parse(data) : null;
                } catch (e) {
                    console.warn('Failed to load from localStorage:', e);
                    return null;
                }
            },

            // Debounce function for performance
            debounce: function(func, delay) {
                let timeoutId;
                return function(...args) {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => func.apply(this, args), delay);
                };
            },

            // Check if user prefers reduced motion
            prefersReducedMotion: function() {
                return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            }
        },

        // Solar Calculator functionality
        calculator: {
            // Solar calculator logic
            calculate: function(formData) {
                const { farmSize, cropType, energyBill, equipment } = formData;
                
                // Base calculation logic
                let baseMultiplier = 1;
                let equipmentMultiplier = 1;
                let cropMultiplier = 1;

                // Farm size multipliers
                switch(farmSize) {
                    case '1-5':
                        baseMultiplier = 0.7;
                        break;
                    case '6-15':
                        baseMultiplier = 0.8;
                        break;
                    case '16-50':
                        baseMultiplier = 0.85;
                        break;
                    case '50+':
                        baseMultiplier = 0.9;
                        break;
                }

                // Crop type adjustments
                const cropMultipliers = {
                    'maize': 1.1,
                    'rice': 1.2,
                    'vegetables': 1.3,
                    'fruits': 1.25,
                    'livestock': 1.4,
                    'mixed': 1.15
                };
                cropMultiplier = cropMultipliers[cropType] || 1;

                // Equipment adjustments
                const equipmentMultipliers = {
                    'irrigation': 1.2,
                    'lighting': 1.0,
                    'cooling': 1.3,
                    'processing': 1.4,
                    'all': 1.5
                };
                equipmentMultiplier = equipmentMultipliers[equipment] || 1;

                // Calculate savings
                const monthlySavings = Math.round(energyBill * baseMultiplier * cropMultiplier * equipmentMultiplier * 0.75);
                const yearlySavings = monthlySavings * 12;
                
                // Calculate system cost and payback period
                const systemCost = monthlySavings * 20; // Rough estimate
                const paybackPeriod = Math.round(systemCost / monthlySavings);

                return {
                    monthlySavings,
                    yearlySavings,
                    paybackPeriod,
                    systemCost
                };
            },

            // Display results
            displayResults: function(results) {
                const { monthlySavings, yearlySavings, paybackPeriod } = results;
                
                // Animate number counting
                this.animateNumber('#monthlySavings', monthlySavings, '$');
                this.animateNumber('#yearlySavings', yearlySavings, '$');
                this.animateNumber('#paybackPeriod', paybackPeriod, '', 'months');

                // Show results container
                $('#calculatorResult').removeClass('d-none').hide().fadeIn(500);

                // Track calculation for analytics
                this.trackCalculation(results);
            },

            // Animate number counting
            animateNumber: function(selector, finalValue, prefix = '', suffix = '') {
                const element = $(selector);
                const duration = FarmersFriend.utils.prefersReducedMotion() ? 0 : 1000;
                
                $({ counter: 0 }).animate({ counter: finalValue }, {
                    duration: duration,
                    step: function() {
                        const value = Math.ceil(this.counter);
                        element.text(prefix + value.toLocaleString() + (suffix ? ' ' + suffix : ''));
                    },
                    complete: function() {
                        element.text(prefix + finalValue.toLocaleString() + (suffix ? ' ' + suffix : ''));
                    }
                });
            },

            // Track calculation for analytics
            trackCalculation: function(results) {
                // Save calculation to local storage for offline access
                const calculation = {
                    timestamp: new Date().toISOString(),
                    results: results
                };
                
                const savedCalculations = FarmersFriend.utils.loadFromStorage('saved_calculations') || [];
                savedCalculations.unshift(calculation);
                
                // Keep only last 10 calculations
                if (savedCalculations.length > 10) {
                    savedCalculations.splice(10);
                }
                
                FarmersFriend.utils.saveToStorage('saved_calculations', savedCalculations);
            }
        },

        // Offline functionality
        offline: {
            isOnline: navigator.onLine,
            
            init: function() {
                // Set up online/offline event listeners
                window.addEventListener('online', this.handleOnline.bind(this));
                window.addEventListener('offline', this.handleOffline.bind(this));
                
                // Check initial state
                if (!this.isOnline) {
                    this.handleOffline();
                }

                // Set up service worker for offline caching
                this.registerServiceWorker();
            },

            handleOnline: function() {
                this.isOnline = true;
                this.hideOfflineIndicator();
                this.showToast(FarmersFriend.utils.t('connectionRestored'), 'success');
                
                // Sync any pending data
                this.syncPendingData();
            },

            handleOffline: function() {
                this.isOnline = false;
                this.showOfflineIndicator();
                this.showToast(FarmersFriend.utils.t('offlineMode'), 'warning');
            },

            showOfflineIndicator: function() {
                if ($('.offline-indicator').length === 0) {
                    const indicator = $(`
                        <div class="offline-indicator">
                            <i class="fas fa-wifi-slash me-2"></i>
                            ${FarmersFriend.utils.t('offlineMode')}
                        </div>
                    `);
                    $('body').prepend(indicator);
                }
                $('.offline-indicator').addClass('show');
            },

            hideOfflineIndicator: function() {
                $('.offline-indicator').removeClass('show');
                setTimeout(() => {
                    $('.offline-indicator').remove();
                }, 300);
            },

            registerServiceWorker: function() {
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js')
                        .then(registration => {
                            console.log('ServiceWorker registered:', registration);
                        })
                        .catch(error => {
                            console.log('ServiceWorker registration failed:', error);
                        });
                }
            },

            syncPendingData: function() {
                // Sync any data that was saved offline
                const pendingData = FarmersFriend.utils.loadFromStorage('pending_sync_data');
                if (pendingData && pendingData.length > 0) {
                    // Process pending data
                    console.log('Syncing pending data:', pendingData);
                    // Clear pending data after successful sync
                    FarmersFriend.utils.saveToStorage('pending_sync_data', []);
                }
            }
        },

        // Language support
        language: {
            init: function() {
                this.setLanguage(FarmersFriend.config.currentLanguage);
            },

            setLanguage: function(lang) {
                if (FarmersFriend.config.supportedLanguages.includes(lang)) {
                    FarmersFriend.config.currentLanguage = lang;
                    localStorage.setItem('farmersFriend_language', lang);
                    this.updatePageLanguage();
                    this.updateLanguageButton();
                }
            },

            updatePageLanguage: function() {
                // Update dynamic text elements
                $('[data-translate]').each(function() {
                    const key = $(this).data('translate');
                    $(this).text(FarmersFriend.utils.t(key));
                });
            },

            updateLanguageButton: function() {
                const languageNames = {
                    'en': 'English',
                    'tw': 'Twi',
                    'fr': 'French',
                    'ha': 'Hausa'
                };
                
                $('.language-selector').text(languageNames[FarmersFriend.config.currentLanguage] || 'English');
            }
        },

        // Accessibility features
        accessibility: {
            init: function() {
                this.setupKeyboardNavigation();
                this.setupScreenReaderSupport();
                this.setupFocusManagement();
            },

            setupKeyboardNavigation: function() {
                // Enhanced keyboard navigation
                $(document).on('keydown', function(e) {
                    if (e.key === 'Escape') {
                        // Close modals on escape
                        $('.modal.show').modal('hide');
                    }
                });

                // Skip link functionality
                $('body').prepend(`
                    <a href="#main-content" class="skip-link">
                        Skip to main content
                    </a>
                `);
            },

            setupScreenReaderSupport: function() {
                // Add ARIA labels for dynamic content
                $('#calculatorResult').attr('aria-live', 'polite');
                
                // Update button text for screen readers
                $('.btn[data-bs-toggle="modal"]').each(function() {
                    const target = $(this).data('bs-target');
                    $(this).attr('aria-describedby', target.replace('#', ''));
                });
            },

            setupFocusManagement: function() {
                // Manage focus for modals
                $('.modal').on('shown.bs.modal', function() {
                    $(this).find('[autofocus], input, button').first().focus();
                });

                $('.modal').on('hidden.bs.modal', function() {
                    $('[data-bs-target="#' + this.id + '"]').focus();
                });
            }
        },

        // Toast notifications
        showToast: function(message, type = 'info', duration = 4000) {
            const toastId = 'toast-' + Date.now();
            const iconClass = {
                'success': 'fa-check-circle',
                'warning': 'fa-exclamation-triangle',
                'error': 'fa-times-circle',
                'info': 'fa-info-circle'
            };

            const toast = $(`
                <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body">
                            <i class="fas ${iconClass[type] || iconClass.info} me-2"></i>
                            ${message}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                    </div>
                </div>
            `);

            // Create toast container if it doesn't exist
            if ($('.toast-container').length === 0) {
                $('body').append('<div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999;"></div>');
            }

            $('.toast-container').append(toast);
            
            const bsToast = new bootstrap.Toast(toast[0], {
                delay: duration
            });
            
            bsToast.show();

            // Remove toast element after it's hidden
            toast.on('hidden.bs.toast', function() {
                $(this).remove();
            });
        },

        // Initialize all modules
        init: function() {
            $(document).ready(() => {
                this.offline.init();
                this.language.init();
                this.accessibility.init();
                this.bindEvents();

                console.log('🌱 Farmers Friend Solar Systems platform initialized');
            });
        },

        // Bind all event handlers
        bindEvents: function() {
            // Solar calculator form submission
            $('#solarCalculator').on('submit', function(e) {
                e.preventDefault();
                
                const formData = {
                    farmSize: $('[name="farmSize"]').val(),
                    cropType: $('[name="cropType"]').val(),
                    energyBill: parseFloat($('[name="energyBill"]').val()),
                    equipment: $('[name="equipment"]').val()
                };

                // Validate form data
                if (!formData.farmSize || !formData.cropType || !formData.energyBill || !formData.equipment) {
                    FarmersFriend.showToast('Please fill in all fields', 'warning');
                    return;
                }

                // Show loading state
                const submitBtn = $(this).find('button[type="submit"]');
                submitBtn.addClass('loading').prop('disabled', true);

                // Simulate calculation delay
                setTimeout(() => {
                    const results = FarmersFriend.calculator.calculate(formData);
                    FarmersFriend.calculator.displayResults(results);
                    
                    submitBtn.removeClass('loading').prop('disabled', false);
                }, 500);
            });

            // Language selection
            $('[onclick^="setLanguage"]').off('click').on('click', function(e) {
                e.preventDefault();
                const lang = $(this).attr('onclick').match(/setLanguage\('(.+)'\)/)[1];
                FarmersFriend.language.setLanguage(lang);
                $('#languageModal').modal('hide');
            });

            // Newsletter subscription
            $('.newsletter-form, [data-newsletter]').on('submit', function(e) {
                e.preventDefault();
                const email = $(this).find('input[type="email"], input[placeholder*="email"]').val();
                
                if (email) {
                    // Save email for offline sync if needed
                    if (!FarmersFriend.offline.isOnline) {
                        const pendingData = FarmersFriend.utils.loadFromStorage('pending_sync_data') || [];
                        pendingData.push({
                            type: 'newsletter',
                            email: email,
                            timestamp: new Date().toISOString()
                        });
                        FarmersFriend.utils.saveToStorage('pending_sync_data', pendingData);
                    }
                    
                    FarmersFriend.showToast('Thank you for subscribing! We\'ll keep you updated.', 'success');
                    $(this)[0].reset();
                }
            });

            // Smooth scrolling for anchor links
            $('a[href^="#"]').on('click', function(e) {
                const target = $(this.getAttribute('href'));
                if (target.length) {
                    e.preventDefault();
                    const offset = target.offset().top - 100;
                    
                    if (FarmersFriend.utils.prefersReducedMotion()) {
                        $(window).scrollTop(offset);
                    } else {
                        $('html, body').animate({
                            scrollTop: offset
                        }, 800);
                    }
                }
            });

            // Form validation enhancement
            $('form').on('submit', function() {
                // Add visual feedback for form submission
                $(this).find('.btn[type="submit"]').addClass('loading');
            });

            // Auto-save form data for offline use
            $('input, select, textarea').on('change', FarmersFriend.utils.debounce(function() {
                const formId = $(this).closest('form').attr('id');
                if (formId) {
                    const formData = $(this).closest('form').serializeArray();
                    FarmersFriend.utils.saveToStorage(`form_${formId}`, formData);
                }
            }, 1000));
        }
    };

    // Global functions for backwards compatibility
    window.setLanguage = function(lang) {
        FarmersFriend.language.setLanguage(lang);
    };

    // Initialize the application
    FarmersFriend.init();

})(jQuery);