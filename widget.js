// Terra Tag Calculator Widget
(function() {
    // Base URL for loading resources and making API calls
    const BASE_URL = 'https://seed-name-badge-calculator.vercel.app';
    
    // Create and inject widget styles
    function injectStyles() {
        const styles = `
            .terra-tag-widget {
                font-family: Verdana, sans-serif !important;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
            }

            .terra-tag-widget * {
                box-sizing: border-box;
                font-family: Verdana, sans-serif !important;
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

            .terra-tag-widget .action-buttons {
                margin-top: 1rem;
            }

            .terra-tag-widget .action-buttons .button-group {
                display: flex;
                gap: 0;
            }

            .terra-tag-widget .action-button {
                flex: 1;
                padding: 1rem;
                font-family: Verdana, sans-serif !important;
                font-size: 1rem;
                font-weight: normal;
                color: #1b4c57;
                background-color: #edf2f7;
                border: 1px solid #e2e8f0;
                border-radius: 0;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .terra-tag-widget .action-button:hover {
                background-color: #e2e8f0;
            }

            .terra-tag-widget .action-button.selected {
                color: white;
                background-color: #1b4c57;
                border-color: #1b4c57;
            }

            .terra-tag-widget .action-button:first-child {
                border-top-left-radius: 6px;
                border-bottom-left-radius: 6px;
            }

            .terra-tag-widget .action-button:last-child {
                border-top-right-radius: 6px;
                border-bottom-right-radius: 6px;
            }

            .terra-tag-widget .additional-form {
                margin-top: 1rem;
                padding-top: 0;
            }

            /* Additional form styles */
            .terra-tag-widget input[type="text"],
            .terra-tag-widget input[type="email"] {
                padding: 0.75rem;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                font-size: 1rem;
                width: 100%;
                transition: border-color 0.2s ease;
                color: #1b4c57;
            }

            .terra-tag-widget input[type="text"]:focus,
            .terra-tag-widget input[type="email"]:focus {
                outline: none;
                border-color: #1b4c57;
                box-shadow: 0 0 0 3px rgba(27, 76, 87, 0.1);
            }

            .terra-tag-widget .submit-button {
                width: 100%;
                padding: 1rem;
                font-size: 1rem;
                font-weight: 600;
                color: white;
                background-color: #1b4c57;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-top: 1.5rem;
            }

            .terra-tag-widget .submit-button:hover:not(:disabled) {
                background-color: #163f48;
            }

            .terra-tag-widget .submit-button:disabled {
                background-color: #cbd5e0;
                cursor: not-allowed;
            }

            .terra-tag-widget .quote-success-message {
                color: #83A764;
                text-align: center;
                margin-top: 1rem;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .terra-tag-widget .quote-success-message.visible {
                opacity: 1;
            }

            /* Paper type button specific styles */
            .terra-tag-widget [data-name="paperType"].option-button {
                flex: 1;
                border-radius: 6px;
                margin-right: 0.75rem;
            }

            .terra-tag-widget [data-name="paperType"].option-button:last-child {
                margin-right: 0;
            }

            /* Payment view styles */
            .payment-view {
                display: none;
                padding: 20px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .payment-view.active {
                display: block;
            }

            #payment-form {
                max-width: 500px;
                margin: 0 auto;
            }

            #card-name-container {
                margin-bottom: 20px;
            }

            #card-name {
                width: calc(100% - 20px);
                padding: 10px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 16px;
                margin-top: 5px;
            }

            #card-element {
                padding: 12px;
                border: 1px solid #ccc;
                border-radius: 4px;
                background: white;
                margin-bottom: 20px;
            }

            #payment-request-button {
                margin-bottom: 20px;
            }

            .payment-button {
                background: #5469d4;
                color: #ffffff;
                font-family: Arial, sans-serif;
                border-radius: 4px;
                border: 0;
                padding: 12px 16px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                display: block;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                transition: all 0.2s ease;
                width: 100%;
            }

            .payment-button:hover {
                filter: brightness(110%);
            }

            .payment-button:disabled {
                opacity: 0.5;
                cursor: default;
            }

            .spinner {
                display: none;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 10px auto;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            #payment-message {
                color: rgb(105, 115, 134);
                font-size: 16px;
                line-height: 20px;
                padding-top: 12px;
                text-align: center;
            }

            #payment-element {
                margin-bottom: 24px;
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
                    <div class="form-group">
                        <label for="quoteFirstName">First name</label>
                        <input type="text" id="quoteFirstName" name="quoteFirstName" required>
                    </div>
                    <div class="form-group">
                        <label for="quoteEmail">Email</label>
                        <input type="email" id="quoteEmail" name="quoteEmail" required>
                    </div>
                    <button type="button" class="submit-button" id="submitQuoteBtn" disabled>Submit</button>
                    <div id="quoteSuccessMessage" class="quote-success-message">Quote sent! Please check your inbox.</div>
                </div>

                <!-- Order Form -->
                <div id="orderForm" class="additional-form" style="display: none;">
                    <div class="form-group">
                        <label for="orderFirstName">First name</label>
                        <input type="text" id="orderFirstName" name="orderFirstName" required>
                    </div>
                    <div class="form-group">
                        <label for="orderLastName">Last name</label>
                        <input type="text" id="orderLastName" name="orderLastName" required>
                    </div>
                    <div class="form-group">
                        <label for="orderCompany">Company</label>
                        <input type="text" id="orderCompany" name="orderCompany" required>
                    </div>
                    <div class="form-group">
                        <label for="orderEmail">Email</label>
                        <input type="email" id="orderEmail" name="orderEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Paper type</label>
                        <div class="button-group">
                            <button type="button" class="option-button" data-name="paperType" data-value="mixedHerb">Mixed herb</button>
                            <button type="button" class="option-button" data-name="paperType" data-value="mixedFlower">Mixed flower</button>
                            <button type="button" class="option-button" data-name="paperType" data-value="randomMix">Random mix</button>
                        </div>
                    </div>
                    <button type="button" class="submit-button" id="payNowBtn" disabled>Pay Now</button>
                </div>
            </form>
        `;

        // Payment view (initially hidden)
        const paymentView = document.createElement('div');
        paymentView.className = 'widget-view payment-view';
        paymentView.innerHTML = `
            <div class="payment-view">
                <form id="payment-form">
                    <div id="card-name-container">
                        <label for="card-name">Name on card</label>
                        <input id="card-name" type="text" placeholder="Name on card" required>
                    </div>
                    <div id="payment-element"></div>
                    <button id="submit-payment" class="payment-button">
                        <div class="spinner" id="spinner"></div>
                        <span id="button-text">Pay now</span>
                    </button>
                    <div id="payment-message"></div>
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

    function showPaymentView() {
        const calculatorView = document.querySelector('.calculator-view');
        const paymentView = document.querySelector('.payment-view');
        
        calculatorView.style.display = 'none';
        paymentView.style.display = 'block';

        // Create payment intent
        fetch(`${BASE_URL}/api/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: calculateTotal() * 100, // Convert to cents
                currency: 'aud',
            }),
        })
        .then(response => response.json())
        .then(data => {
            initializePaymentElement(data.clientSecret);
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('An error occurred while setting up the payment. Please try again.');
        });
    }

    // Add event listener to the Pay Now button
    document.querySelector('#pay-now-button').addEventListener('click', showPaymentView);
})(); 