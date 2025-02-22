// Terra Tag Calculator Widget
(async function() {
    // Configuration
    const config = {
        BASE_URL: window.TERRA_TAG_WIDGET_CONFIG?.baseUrl || 'https://seed-name-badge-calculator.vercel.app'
    };

    // State management
    const state = {
        currentView: 'calculator',
        stripe: null,
        elements: null,
        paymentElement: null,
        calculator: null
    };

    // Initialize widget
    async function initWidget() {
        try {
            await loadDependencies();
            await initializeServices();
            injectStyles();
            createWidgetStructure();
            initializeCalculator();
            setupEventListeners();
        } catch (error) {
            console.error('Widget initialization error:', error);
        }
    }

    // Helper functions
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    }

    // Load external dependencies
    async function loadDependencies() {
        await Promise.all([
            loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/dist/umd/supabase.min.js'),
            loadScript('https://js.stripe.com/v3/')
        ]);
    }

    // Initialize services with secure configuration
    async function initializeServices() {
        try {
            // Fetch configuration from server
            const response = await fetch(`${config.BASE_URL}/api/config`);
            if (!response.ok) {
                throw new Error('Failed to fetch configuration');
            }
            const serviceConfig = await response.json();

            // Initialize Stripe
            state.stripe = Stripe(serviceConfig.stripePublicKey);

            // Initialize Supabase
            window.widgetSupabase = supabase.createClient(
                serviceConfig.supabaseUrl,
                serviceConfig.supabaseKey
            );
        } catch (error) {
            console.error('Error initializing services:', error);
            throw error;
        }
    }

    // Inject styles
    function injectStyles() {
        const link = createElement('link', {
            rel: 'stylesheet',
            href: `${config.BASE_URL}/src/styles/main.css`
        });
        document.head.appendChild(link);
    }

    // Create widget structure
    function createWidgetStructure() {
        const widgetContainer = createElement('div', { className: 'terra-tag-widget' });
        
        // Create calculator view
        const calculatorView = createElement('div', {
            className: 'widget-view calculator-view active'
        }, [
            createElement('h1', { className: 'calculator-heading' }, ['Minimum order of 75']),
            createElement('form', { 
                id: 'calculatorForm',
                className: 'calculator-form'
            }, [
                // Quantity with guests
                createElement('div', { className: 'form-group' }, [
                    createElement('label', { for: 'quantityWithGuests' }, ['Enter quantity with guest details printed']),
                    createElement('input', {
                        type: 'number',
                        id: 'quantityWithGuests',
                        name: 'quantityWithGuests',
                        min: '0',
                        placeholder: '0'
                    })
                ]),

                // Quantity without guests
                createElement('div', { className: 'form-group' }, [
                    createElement('label', { for: 'quantityWithoutGuests' }, ['Enter quantity without guest details printed']),
                    createElement('input', {
                        type: 'number',
                        id: 'quantityWithoutGuests',
                        name: 'quantityWithoutGuests',
                        min: '0',
                        placeholder: '0'
                    })
                ]),

                // Warning message
                createElement('div', { 
                    id: 'minimumQuantityWarning',
                    className: 'warning-message'
                }, ['Enter a minimum of 75 above']),

                // Size selection
                createElement('div', { className: 'form-group' }, [
                    createElement('label', {}, ['Size']),
                    createElement('div', { className: 'button-group' }, [
                        createElement('button', {
                            type: 'button',
                            className: 'option-button selected',
                            dataset: { name: 'size', value: 'A7' }
                        }, ['A7']),
                        createElement('button', {
                            type: 'button',
                            className: 'option-button',
                            dataset: { name: 'size', value: 'A6' }
                        }, ['A6'])
                    ])
                ]),

                // Printed sides selection
                createElement('div', { className: 'form-group' }, [
                    createElement('label', {}, ['Printed sides']),
                    createElement('div', { className: 'button-group' }, [
                        createElement('button', {
                            type: 'button',
                            className: 'option-button selected',
                            dataset: { name: 'printedSides', value: 'single' }
                        }, ['Single sided']),
                        createElement('button', {
                            type: 'button',
                            className: 'option-button',
                            dataset: { name: 'printedSides', value: 'double' }
                        }, ['Double sided'])
                    ])
                ]),

                // Ink coverage selection
                createElement('div', { className: 'form-group' }, [
                    createElement('label', {}, ['Ink coverage']),
                    createElement('div', { className: 'button-group' }, [
                        createElement('button', {
                            type: 'button',
                            className: 'option-button selected',
                            dataset: { name: 'inkCoverage', value: 'upTo40' }
                        }, ['Up to 40%']),
                        createElement('button', {
                            type: 'button',
                            className: 'option-button',
                            dataset: { name: 'inkCoverage', value: 'over40' }
                        }, ['Over 40%'])
                    ])
                ]),

                // Lanyards selection
                createElement('div', { className: 'form-group' }, [
                    createElement('label', {}, ['Lanyards included']),
                    createElement('div', { className: 'button-group' }, [
                        createElement('button', {
                            type: 'button',
                            className: 'option-button selected',
                            dataset: { name: 'lanyards', value: 'yes' }
                        }, ['Yes']),
                        createElement('button', {
                            type: 'button',
                            className: 'option-button',
                            dataset: { name: 'lanyards', value: 'no' }
                        }, ['No'])
                    ])
                ]),

                // Shipping selection
                createElement('div', { className: 'form-group' }, [
                    createElement('label', {}, ['Shipping']),
                    createElement('div', { className: 'button-group' }, [
                        createElement('button', {
                            type: 'button',
                            className: 'option-button selected',
                            dataset: { name: 'shipping', value: 'standard' }
                        }, ['Standard']),
                        createElement('button', {
                            type: 'button',
                            className: 'option-button',
                            dataset: { name: 'shipping', value: 'express' }
                        }, ['Express'])
                    ])
                ]),

                // Total price display
                createElement('div', { 
                    id: 'totalPrice',
                    className: 'total-price'
                }),

                // Action buttons
                createElement('div', {
                    id: 'actionButtons',
                    className: 'action-buttons',
                    style: 'display: none;'
                }, [
                    createElement('div', { className: 'button-group' }, [
                        createElement('button', {
                            type: 'button',
                            className: 'action-button',
                            id: 'orderNowBtn'
                        }, ['Order Now']),
                        createElement('button', {
                            type: 'button',
                            className: 'action-button',
                            id: 'emailQuoteBtn'
                        }, ['Email the quote'])
                    ])
                ]),

                // Email Quote Form
                createElement('div', {
                    id: 'emailQuoteForm',
                    className: 'additional-form',
                    style: 'display: none;'
                }, [
                    createElement('div', { className: 'form-group' }, [
                        createElement('label', { for: 'quoteFirstName' }, ['First name']),
                        createElement('input', {
                            type: 'text',
                            id: 'quoteFirstName',
                            name: 'quoteFirstName',
                            required: true
                        })
                    ]),
                    createElement('div', { className: 'form-group' }, [
                        createElement('label', { for: 'quoteEmail' }, ['Email']),
                        createElement('input', {
                            type: 'email',
                            id: 'quoteEmail',
                            name: 'quoteEmail',
                            required: true
                        })
                    ]),
                    createElement('button', {
                        type: 'button',
                        className: 'submit-button',
                        id: 'submitQuoteBtn',
                        disabled: true
                    }, [
                        createElement('div', { className: 'button-content' }, [
                            createElement('div', { className: 'spinner' }),
                            createElement('span', {}, ['Submit'])
                        ])
                    ]),
                    createElement('div', {
                        id: 'quoteSuccessMessage',
                        className: 'quote-success-message'
                    }, ['Quote sent! Please check your inbox.'])
                ]),

                // Order Form
                createElement('div', {
                    id: 'orderForm',
                    className: 'additional-form',
                    style: 'display: none;'
                }, [
                    createElement('div', { className: 'form-group' }, [
                        createElement('label', { for: 'orderFirstName' }, ['First name']),
                        createElement('input', {
                            type: 'text',
                            id: 'orderFirstName',
                            name: 'orderFirstName',
                            required: true
                        })
                    ]),
                    createElement('div', { className: 'form-group' }, [
                        createElement('label', { for: 'orderLastName' }, ['Last name']),
                        createElement('input', {
                            type: 'text',
                            id: 'orderLastName',
                            name: 'orderLastName',
                            required: true
                        })
                    ]),
                    createElement('div', { className: 'form-group' }, [
                        createElement('label', { for: 'orderCompany' }, ['Company']),
                        createElement('input', {
                            type: 'text',
                            id: 'orderCompany',
                            name: 'orderCompany'
                        })
                    ]),
                    createElement('div', { className: 'form-group' }, [
                        createElement('label', { for: 'orderEmail' }, ['Email']),
                        createElement('input', {
                            type: 'email',
                            id: 'orderEmail',
                            name: 'orderEmail',
                            required: true
                        })
                    ]),
                    createElement('div', { className: 'form-group' }, [
                        createElement('label', {}, ['Paper type']),
                        createElement('div', { className: 'button-group' }, [
                            createElement('button', {
                                type: 'button',
                                className: 'option-button',
                                dataset: { name: 'paperType', value: 'mixedHerb' }
                            }, ['Mixed herb']),
                            createElement('button', {
                                type: 'button',
                                className: 'option-button',
                                dataset: { name: 'paperType', value: 'mixedFlower' }
                            }, ['Mixed flower']),
                            createElement('button', {
                                type: 'button',
                                className: 'option-button',
                                dataset: { name: 'paperType', value: 'randomMix' }
                            }, ['Random mix'])
                        ])
                    ]),
                    createElement('button', {
                        type: 'button',
                        className: 'submit-button',
                        id: 'payNowBtn',
                        disabled: true
                    }, [
                        createElement('div', { className: 'button-content' }, [
                            createElement('div', { className: 'spinner' }),
                            createElement('span', {}, ['Checkout'])
                        ])
                    ])
                ])
            ])
        ]);
        
        // Create payment view
        const paymentView = createElement('div', {
            className: 'widget-view payment-view'
        }, [
            createElement('div', { className: 'payment-container' }, [
                createElement('a', { 
                    href: '#',
                    className: 'back-link'
                }, ['← Back']),
                createElement('div', { className: 'order-details' }, [
                    createElement('h2', {}, ['Order Summary']),
                    createElement('div', { 
                        id: 'order-summary',
                        className: 'order-summary'
                    }),
                    createElement('div', { 
                        id: 'order-amount',
                        className: 'total-amount'
                    })
                ]),
                createElement('form', { id: 'payment-form' }, [
                    createElement('div', { className: 'card-name-group' }, [
                        createElement('label', { for: 'card-name' }, ['Name on card']),
                        createElement('input', {
                            id: 'card-name',
                            type: 'text',
                            required: true
                        })
                    ]),
                    createElement('div', { id: 'payment-element' }),
                    createElement('button', {
                        id: 'submit-payment',
                        className: 'payment-button'
                    }, [
                        createElement('div', { 
                            className: 'spinner',
                            id: 'spinner'
                        }),
                        createElement('span', { id: 'button-text' }, ['Pay now'])
                    ]),
                    createElement('div', { id: 'payment-message' })
                ])
            ])
        ]);
        
        // Create success view
        const successView = createElement('div', {
            className: 'widget-view success-view'
        }, [
            createElement('div', { className: 'success-container' }, [
                createElement('div', { className: 'success-icon' }, ['✓']),
                createElement('h2', { className: 'success-message' }, ['Payment Successful!']),
                createElement('p', { className: 'success-text' }, [
                    'Thank you for your order. A tax receipt will be emailed to you shortly. We\'ll also reach out to you soon to discuss your artwork.'
                ])
            ])
        ]);

        // Append views to container
        widgetContainer.appendChild(calculatorView);
        widgetContainer.appendChild(paymentView);
        widgetContainer.appendChild(successView);

        // Find or create target element
        let targetElement = document.getElementById('terra-tag-calculator');
        if (!targetElement) {
            targetElement = createElement('div', { id: 'terra-tag-calculator' });
            document.body.appendChild(targetElement);
        }

        // Insert widget
        targetElement.appendChild(widgetContainer);
    }

    // Initialize calculator
    function initializeCalculator() {
        state.calculator = new Calculator();
        state.calculator.addStateChangeListener(handleCalculatorStateChange);
    }

    // Handle calculator state changes
    function handleCalculatorStateChange(calculatorState) {
        updateDisplay(calculatorState);
    }

    // Update display based on calculator state
    function updateDisplay(calculatorState) {
        // Implementation will be added in the next phase
        console.log('Display update with state:', calculatorState);
    }

    // Set up event listeners
    function setupEventListeners() {
        // Event listeners will be added in the next phase
        console.log('Setting up event listeners');
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();