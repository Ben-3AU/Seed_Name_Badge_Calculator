// Terra Tag Calculator Widget
(function() {
    // Base URL for loading resources and making API calls
    const BASE_URL = 'https://seed-name-badge-calculator.vercel.app';
    
    // Create and inject widget styles
    function injectStyles() {
        const styles = `
            .terra-tag-widget {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
            }

            .terra-tag-widget * {
                box-sizing: border-box;
            }

            .terra-tag-widget .calculator-heading {
                font-family: Verdana, sans-serif;
                font-size: 1.5rem;
                font-weight: normal;
                color: #1b4c57;
                text-align: center;
                margin-bottom: 2rem;
            }

            .terra-tag-widget .calculator-form {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .terra-tag-widget .form-group {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .terra-tag-widget label {
                font-size: 0.9375rem;
                font-weight: 500;
                color: #1b4c57;
            }

            .terra-tag-widget input[type="number"] {
                padding: 0.75rem;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                font-size: 1rem;
                width: 100%;
                transition: border-color 0.2s ease;
                color: #1b4c57;
            }

            .terra-tag-widget .button-group {
                display: flex;
                gap: 0;
            }

            .terra-tag-widget .option-button {
                flex: 1;
                padding: 0.75rem 1rem;
                font-family: Verdana, sans-serif;
                font-size: 0.9375rem;
                font-weight: normal;
                color: #1b4c57;
                background-color: #edf2f7;
                border: 1px solid #e2e8f0;
                border-radius: 0;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .terra-tag-widget .option-button:hover {
                background-color: #e2e8f0;
            }

            .terra-tag-widget .option-button.selected {
                background-color: #1b4c57;
                border-color: #1b4c57;
                color: white;
            }

            .terra-tag-widget .option-button:first-child {
                border-top-left-radius: 6px;
                border-bottom-left-radius: 6px;
            }

            .terra-tag-widget .option-button:last-child {
                border-top-right-radius: 6px;
                border-bottom-right-radius: 6px;
            }

            .terra-tag-widget .warning-message {
                color: #e53e3e;
                font-size: 0.875rem;
                margin-top: -0.5rem;
                display: none;
            }

            .terra-tag-widget .total-price {
                margin-top: 1rem;
                padding: 1rem;
                background-color: #f7fafc;
                border-radius: 6px;
                font-weight: normal;
                font-size: 1rem;
                color: #1b4c57;
                text-align: center;
                min-height: 4rem;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            /* Views management */
            .terra-tag-widget .widget-view {
                display: none;
            }

            .terra-tag-widget .widget-view.active {
                display: block;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Create widget HTML structure
    function createWidgetStructure() {
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'terra-tag-widget';
        
        // Calculator view
        const calculatorView = document.createElement('div');
        calculatorView.className = 'widget-view calculator-view active';
        calculatorView.innerHTML = `
            <h1 class="calculator-heading">Minimum order of 75</h1>
            <form id="calculatorForm" class="calculator-form">
                <div class="form-group">
                    <label for="quantityWithGuests">Enter quantity with guest details printed</label>
                    <input type="number" id="quantityWithGuests" name="quantityWithGuests" min="0" placeholder="0">
                </div>

                <div class="form-group">
                    <label for="quantityWithoutGuests">Enter quantity without guest details printed</label>
                    <input type="number" id="quantityWithoutGuests" name="quantityWithoutGuests" min="0" placeholder="0">
                </div>

                <div id="minimumQuantityWarning" class="warning-message">
                    Enter a minimum of 75 above
                </div>

                <div class="form-group">
                    <label>Size</label>
                    <div class="button-group">
                        <button type="button" class="option-button selected" data-name="size" data-value="A7">A7</button>
                        <button type="button" class="option-button" data-name="size" data-value="A6">A6</button>
                    </div>
                </div>

                <div class="form-group">
                    <label>Printed sides</label>
                    <div class="button-group">
                        <button type="button" class="option-button selected" data-name="printedSides" data-value="single">Single sided</button>
                        <button type="button" class="option-button" data-name="printedSides" data-value="double">Double sided</button>
                    </div>
                </div>

                <div class="form-group">
                    <label>Ink coverage</label>
                    <div class="button-group">
                        <button type="button" class="option-button selected" data-name="inkCoverage" data-value="upTo40">Up to 40%</button>
                        <button type="button" class="option-button" data-name="inkCoverage" data-value="over40">Over 40%</button>
                    </div>
                </div>

                <div class="form-group">
                    <label>Lanyards included</label>
                    <div class="button-group">
                        <button type="button" class="option-button selected" data-name="lanyards" data-value="yes">Yes</button>
                        <button type="button" class="option-button" data-name="lanyards" data-value="no">No</button>
                    </div>
                </div>

                <div class="form-group">
                    <label>Shipping</label>
                    <div class="button-group">
                        <button type="button" class="option-button selected" data-name="shipping" data-value="standard">Standard</button>
                        <button type="button" class="option-button" data-name="shipping" data-value="express">Express</button>
                    </div>
                </div>

                <div id="totalPrice" class="total-price">
                    <!-- Price content will be displayed here -->
                </div>

                <div id="actionButtons" class="action-buttons" style="display: none;">
                    <div class="button-group">
                        <button type="button" class="action-button" id="orderNowBtn">Order Now</button>
                        <button type="button" class="action-button" id="emailQuoteBtn">Email the quote</button>
                    </div>
                </div>

                <!-- Email Quote Form -->
                <div id="emailQuoteForm" class="additional-form" style="display: none;">
                    <!-- Quote form content -->
                </div>

                <!-- Order Form -->
                <div id="orderForm" class="additional-form" style="display: none;">
                    <!-- Order form content -->
                </div>
            </form>
        `;

        // Payment view (initially hidden)
        const paymentView = document.createElement('div');
        paymentView.className = 'widget-view payment-view';
        paymentView.innerHTML = `
            <div class="container">
                <a href="#" class="back-link" onclick="return false;">
                    <span class="back-arrow">←</span>
                    Cancel
                </a>
                
                <div class="order-details">
                    <h2>Order Summary</h2>
                    <ul id="order-summary" class="order-summary">
                        <!-- Order details will be populated here -->
                    </ul>
                    <div id="order-amount" class="amount"></div>
                </div>
                
                <div id="loading">
                    Loading payment form...
                </div>
                
                <form id="payment-form">
                    <div id="card-name-container">
                        <label for="card-name" id="card-name-label">Name on card</label>
                        <input type="text" id="card-name" required>
                    </div>
                    <div id="payment-element"></div>
                    <button id="submit" type="submit">Pay now</button>
                    <div id="error-message"></div>
                </form>
            </div>
        `;
        
        // Success view (initially hidden)
        const successView = document.createElement('div');
        successView.className = 'widget-view success-view';
        successView.innerHTML = `
            <div class="success-container">
                <div class="success-icon">✓</div>
                <h1 class="success-message">Payment Successful!</h1>
                <p>Thank you for your order. A tax receipt will be emailed to you shortly. We'll also reach out to you soon to discuss your artwork.</p>
            </div>
        `;

        // Append all views to the widget container
        widgetContainer.appendChild(calculatorView);
        widgetContainer.appendChild(paymentView);
        widgetContainer.appendChild(successView);

        // Find the target element or create one if it doesn't exist
        let targetElement = document.getElementById('terra-tag-calculator');
        if (!targetElement) {
            targetElement = document.createElement('div');
            targetElement.id = 'terra-tag-calculator';
            document.body.appendChild(targetElement);
        }

        // Insert the widget into the target element
        targetElement.appendChild(widgetContainer);
    }

    // Initialize the widget
    function initWidget() {
        // Load required external scripts
        function loadScript(src, callback) {
            const script = document.createElement('script');
            script.src = src;
            script.onload = callback;
            document.head.appendChild(script);
        }

        // Load Supabase and Stripe scripts
        loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/dist/umd/supabase.min.js', () => {
            loadScript('https://js.stripe.com/v3/', () => {
                // Load calculator functionality
                loadScript(`${BASE_URL}/widget-calculator.js`, () => {
                    // Initialize the widget functionality
                    initializeCalculator();
                });
            });
        });
    }

    // Main initialization
    function initialize() {
        injectStyles();
        createWidgetStructure();
        initWidget();
    }

    // Start the widget
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})(); 