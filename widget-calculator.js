// Calculator functionality
let BASE_URL;  // Declare BASE_URL at the top level

function initializeCalculator(baseUrl) {
    // Store the base URL
    BASE_URL = baseUrl;  // Assign to the top-level variable

    // Initialize Supabase
    const supabaseUrl = 'https://pxxqvjxmzmsqunrhegcq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eHF2anhtem1zcXVucmhlZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDk0NTcsImV4cCI6MjA1NDAyNTQ1N30.5CUbSb2OR9H4IrGHx_vxmIPZCWN8x7TYoG5RUeYAehM';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // Initialize Stripe
    const stripe = Stripe('pk_test_51QrDDBDCFS4sGBlEhdnhx2eN3J3SO2VWoyhZd5IkFphglGQG97FxaBMxdXNqH4eiDKzCUoQNqgUyZnQN7PWphZNm00I3pBTYW4');

    // Core calculation functions
    function calculateTotalQuantity() {
        const withGuests = parseInt(document.getElementById('quantityWithGuests').value) || 0;
        const withoutGuests = parseInt(document.getElementById('quantityWithoutGuests').value) || 0;
        return withGuests + withoutGuests;
    }

    function getSelectedValue(name) {
        const selected = document.querySelector(`.terra-tag-widget .option-button.selected[data-name="${name}"]`);
        return selected ? selected.getAttribute('data-value') : null;
    }

    function calculateTotalPrice() {
        const totalQuantity = calculateTotalQuantity();
        const withGuests = parseInt(document.getElementById('quantityWithGuests').value) || 0;
        const withoutGuests = parseInt(document.getElementById('quantityWithoutGuests').value) || 0;
        let totalPrice = (withGuests * 6) + (withoutGuests * 5);

        if (totalQuantity > 300) totalPrice -= 0.50 * totalQuantity;

        const size = getSelectedValue('size');
        const printedSides = getSelectedValue('printedSides');
        const inkCoverage = getSelectedValue('inkCoverage');
        const lanyards = getSelectedValue('lanyards');
        const shipping = getSelectedValue('shipping');

        if (size === 'A6') totalPrice += 3 * totalQuantity;
        if (printedSides === 'double') totalPrice += (size === 'A7' ? 0.50 : 1.00) * totalQuantity;
        if (inkCoverage === 'over40') totalPrice += (size === 'A7' ? 0.50 : 1.00) * totalQuantity;
        if (lanyards === 'no') totalPrice -= 0.50 * totalQuantity;

        let shippingCost = 0;
        if (size === 'A7') {
            if (totalQuantity < 200) shippingCost = 20;
            else if (totalQuantity <= 500) shippingCost = 30;
            else shippingCost = 50;
        } else {
            if (totalQuantity < 200) shippingCost = 30;
            else if (totalQuantity <= 500) shippingCost = 45;
            else shippingCost = 75;
        }

        if (shipping === 'express') shippingCost *= 2;
        totalPrice += shippingCost;
        totalPrice *= 1.10;
        totalPrice *= 1.017;

        return totalPrice;
    }

    function calculateGST(totalPrice) {
        return totalPrice / 11;
    }

    function calculateCO2Savings() {
        return calculateTotalQuantity() * 0.11;
    }

    // Display function
    function updateDisplay() {
        const totalQuantity = calculateTotalQuantity();
        const warningDiv = document.querySelector('.terra-tag-widget #minimumQuantityWarning');
        const totalPriceDiv = document.querySelector('.terra-tag-widget #totalPrice');
        const actionButtons = document.querySelector('.terra-tag-widget #actionButtons');
        const emailQuoteForm = document.querySelector('.terra-tag-widget #emailQuoteForm');
        const orderForm = document.querySelector('.terra-tag-widget #orderForm');

        totalPriceDiv.style.display = 'block';

        if (totalQuantity < 75) {
            warningDiv.style.display = 'none';
            totalPriceDiv.innerHTML = `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 1em; color: #333;">
                        Enter a minimum quantity of 75 above
                    </div>
                </div>
            `;
            actionButtons.style.display = 'none';
            emailQuoteForm.style.display = 'none';
            orderForm.style.display = 'none';
        } else {
            warningDiv.style.display = 'none';
            const totalPrice = calculateTotalPrice();
            const gst = calculateGST(totalPrice);
            const co2Savings = calculateCO2Savings();

            totalPriceDiv.innerHTML = `
                <div style="font-size: 2em; font-weight: 600;">Total Cost: $${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div style="font-size: 0.9em; display: flex; justify-content: center; align-items: center; margin-top: 0.5rem;">
                    <span>GST Included: $${gst.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span style="margin: 0 1rem;">&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;</span>
                    <span>CO2 emissions saved: ${co2Savings.toFixed(2)} kg</span>
                </div>
            `;
            actionButtons.style.display = 'block';
        }
    }

    // Event Listeners
    const widget = document.querySelector('.terra-tag-widget');
    
    // Prevent form submission
    const form = widget.querySelector('#calculatorForm');
    form.addEventListener('submit', e => e.preventDefault());

    // Add quantity input listeners
    widget.querySelector('#quantityWithGuests').addEventListener('input', updateDisplay);
    widget.querySelector('#quantityWithoutGuests').addEventListener('input', updateDisplay);

    // Add button click listeners for all option buttons
    widget.querySelectorAll('.option-button').forEach(button => {
        button.addEventListener('click', e => {
            e.preventDefault();
            const buttonGroup = e.target.closest('.button-group');
            buttonGroup.querySelectorAll('.option-button').forEach(btn => {
                btn.classList.remove('selected');
            });
            e.target.classList.add('selected');
            updateDisplay();
            if (e.target.getAttribute('data-name') === 'paperType') {
                validateOrderForm();
            }
        });
    });

    // Add email quote button handler
    const emailQuoteBtn = widget.querySelector('#emailQuoteBtn');
    const orderNowBtn = widget.querySelector('#orderNowBtn');
    const emailQuoteForm = widget.querySelector('#emailQuoteForm');
    const orderForm = widget.querySelector('#orderForm');

    emailQuoteBtn.addEventListener('click', () => {
        emailQuoteForm.style.display = 'block';
        orderForm.style.display = 'none';
        emailQuoteBtn.classList.add('selected');
        orderNowBtn.classList.remove('selected');
    });

    orderNowBtn.addEventListener('click', () => {
        orderForm.style.display = 'block';
        emailQuoteForm.style.display = 'none';
        orderNowBtn.classList.add('selected');
        emailQuoteBtn.classList.remove('selected');
    });

    // Function to validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Function to validate email quote form
    function validateEmailQuoteForm() {
        const firstName = widget.querySelector('#quoteFirstName').value.trim();
        const email = widget.querySelector('#quoteEmail').value.trim();
        widget.querySelector('#submitQuoteBtn').disabled = !(firstName && isValidEmail(email));
    }

    // Function to validate order form
    function validateOrderForm() {
        const firstName = widget.querySelector('#orderFirstName').value.trim();
        const lastName = widget.querySelector('#orderLastName').value.trim();
        const company = widget.querySelector('#orderCompany').value.trim();
        const email = widget.querySelector('#orderEmail').value.trim();
        const paperType = getSelectedValue('paperType');
        widget.querySelector('#payNowBtn').disabled = !(firstName && lastName && company && isValidEmail(email) && paperType);
    }

    // Add form validation listeners
    widget.querySelector('#emailQuoteForm').querySelectorAll('input').forEach(input => {
        input.addEventListener('input', validateEmailQuoteForm);
    });

    widget.querySelector('#orderForm').querySelectorAll('input').forEach(input => {
        input.addEventListener('input', validateOrderForm);
    });

    // Handle quote submission
    widget.querySelector('#submitQuoteBtn').addEventListener('click', async (event) => {
        event.preventDefault();
        
        const totalCost = calculateTotalPrice();
        const gstAmount = calculateGST(totalCost);
        
        const quoteData = {
            quantity_with_guests: parseInt(widget.querySelector('#quantityWithGuests').value) || 0,
            quantity_without_guests: parseInt(widget.querySelector('#quantityWithoutGuests').value) || 0,
            size: getSelectedValue('size'),
            printed_sides: getSelectedValue('printedSides'),
            ink_coverage: getSelectedValue('inkCoverage'),
            lanyards: getSelectedValue('lanyards') === 'yes',
            shipping: getSelectedValue('shipping'),
            first_name: widget.querySelector('#quoteFirstName').value.trim(),
            email: widget.querySelector('#quoteEmail').value.trim(),
            total_quantity: calculateTotalQuantity(),
            total_cost: Number(totalCost.toFixed(2)),
            gst_amount: Number(gstAmount.toFixed(2)),
            co2_savings: calculateCO2Savings(),
            email_sent: false
        };

        try {
            const response = await fetch(`${BASE_URL}/api/submit-quote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(quoteData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process quote');
            }

            // Show success message
            const successMessage = widget.querySelector('#quoteSuccessMessage');
            successMessage.classList.add('visible');
            setTimeout(() => {
                successMessage.classList.remove('visible');
            }, 3000);
            
        } catch (error) {
            console.error('Error processing quote:', error);
            alert('Error sending quote. Please try again.');
        }
    });

    // Handle order submission
    widget.querySelector('#payNowBtn').addEventListener('click', async (event) => {
        event.preventDefault();
        
        const totalCost = calculateTotalPrice();
        const gstAmount = calculateGST(totalCost);
        
        const orderData = {
            quantity_with_guests: parseInt(widget.querySelector('#quantityWithGuests').value) || 0,
            quantity_without_guests: parseInt(widget.querySelector('#quantityWithoutGuests').value) || 0,
            size: getSelectedValue('size'),
            printed_sides: getSelectedValue('printedSides'),
            ink_coverage: getSelectedValue('inkCoverage'),
            lanyards: getSelectedValue('lanyards') === 'yes',
            shipping: getSelectedValue('shipping'),
            paper_type: getSelectedValue('paperType'),
            first_name: widget.querySelector('#orderFirstName').value.trim(),
            last_name: widget.querySelector('#orderLastName').value.trim(),
            company: widget.querySelector('#orderCompany').value.trim(),
            email: widget.querySelector('#orderEmail').value.trim(),
            total_quantity: calculateTotalQuantity(),
            total_cost: Number(totalCost.toFixed(2)),
            gst_amount: Number(gstAmount.toFixed(2)),
            co2_savings: calculateCO2Savings(),
            payment_status: 'pending',
            email_sent: false
        };

        try {
            const payNowBtn = widget.querySelector('#payNowBtn');
            payNowBtn.disabled = true;
            
            // Create a payment intent
            const response = await fetch(`${BASE_URL}/api/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderData })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create payment intent');
            }

            const result = await response.json();
            
            // Get client secret directly from the response
            const clientSecret = result.clientSecret;
            
            if (!clientSecret) {
                throw new Error('No client secret received from the server');
            }

            // First create the payment view structure if it doesn't exist
            let paymentView = widget.querySelector('.payment-view');
            if (!paymentView) {
                paymentView = document.createElement('div');
                paymentView.className = 'widget-view payment-view';
                widget.appendChild(paymentView);
            }

            // Initialize payment form with order data
            await initializePaymentElement(clientSecret, orderData);
            
        } catch (error) {
            console.error('Error processing order:', error);
            const payNowBtn = widget.querySelector('#payNowBtn');
            payNowBtn.disabled = false;
            alert('Error processing order: ' + (error.message || 'Unknown error'));
        }
    });

    // Initial display update
    updateDisplay();

    // Payment related functions
    async function initializePaymentElement(clientSecret, orderData) {
        if (!clientSecret) {
            throw new Error('Client secret is required to initialize payment element');
        }

        const appearance = {
            theme: 'stripe',
            variables: {
                colorPrimary: '#1b4c57',
                fontFamily: 'Verdana, sans-serif',
                borderRadius: '6px',
                fontSizeBase: '16px',
                spacingUnit: '4px',
                spacingGridRow: '16px'
            }
        };

        elements = stripe.elements({ 
            appearance, 
            clientSecret
        });
        
        // Create and mount the payment element
        paymentElement = elements.create('payment', {
            layout: {
                type: 'tabs',
                defaultCollapsed: false
            }
        });
        
        // Get the views
        const calculatorView = widget.querySelector('.calculator-view');
        const paymentView = widget.querySelector('.payment-view');
        
        if (!calculatorView || !paymentView) {
            throw new Error('Required views not found');
        }

        // Update the payment view HTML structure
        paymentView.innerHTML = `
            <div class="payment-container">
                <a href="#" class="back-link">← Cancel</a>
                
                <div class="order-details">
                    <h2>Order Summary</h2>
                    <div class="order-summary">
                        <div class="summary-row">
                            <div class="label">Name:</div>
                            <div class="value">${orderData.first_name} ${orderData.last_name}</div>
                        </div>
                        
                        <div class="summary-row">
                            <div class="label">Company:</div>
                            <div class="value">${orderData.company}</div>
                        </div>
                        
                        <div class="summary-row">
                            <div class="label">Email:</div>
                            <div class="value">${orderData.email}</div>
                        </div>
                        
                        <div class="summary-row">
                            <div class="label">Quantity with guest details printed:</div>
                            <div class="value">${orderData.quantity_with_guests}</div>
                        </div>
                        
                        <div class="summary-row">
                            <div class="label">Quantity without guest details printed:</div>
                            <div class="value">${orderData.quantity_without_guests}</div>
                        </div>
                        
                        <div class="summary-row">
                            <div class="label">Total quantity:</div>
                            <div class="value">${orderData.total_quantity}</div>
                        </div>
                        
                        <div class="summary-row">
                            <div class="label">Size:</div>
                            <div class="value">${orderData.size}</div>
                        </div>
                        
                        <div class="summary-row">
                            <div class="label">Printed sides:</div>
                            <div class="value">${orderData.printed_sides === 'double' ? 'Double sided' : 'Single sided'}</div>
                        </div>
                        
                        <div class="summary-row">
                            <div class="label">Ink coverage:</div>
                            <div class="value">${orderData.ink_coverage === 'over40' ? 'Over 40%' : 'Up to 40%'}</div>
                        </div>
                        
                        <div class="summary-row">
                            <div class="label">Lanyards:</div>
                            <div class="value">${orderData.lanyards ? 'Yes' : 'No'}</div>
                        </div>
                        
                        <div class="summary-row">
                            <div class="label">Shipping:</div>
                            <div class="value">${orderData.shipping.charAt(0).toUpperCase() + orderData.shipping.slice(1)}</div>
                        </div>
                        
                        <div class="summary-row">
                            <div class="label">Paper type:</div>
                            <div class="value">${orderData.paper_type.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase())}</div>
                        </div>
                    </div>
                    <div class="total-amount">$${orderData.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>

                <form id="payment-form">
                    <div class="form-group card-name-group">
                        <label for="card-name">Name on card</label>
                        <input id="card-name" type="text" required>
                    </div>
                    <div id="payment-element"></div>
                    <button id="submit-payment" class="payment-button">
                        Pay now
                    </button>
                    <div id="payment-message"></div>
                </form>
            </div>
        `;

        // Hide calculator view and show payment view
        calculatorView.style.display = 'none';
        paymentView.style.display = 'block';
        
        // Mount the payment element
        const paymentElementMount = paymentView.querySelector('#payment-element');
        if (!paymentElementMount) {
            throw new Error('Payment element mount point not found');
        }

        paymentElement.mount('#payment-element');
        
        // Add event listener to the submit button
        const submitButton = paymentView.querySelector('#submit-payment');
        if (submitButton) {
            submitButton.addEventListener('click', handlePaymentSubmission);
        }

        // Add event listener to the back link
        const backLink = paymentView.querySelector('.back-link');
        if (backLink) {
            backLink.addEventListener('click', (e) => {
                e.preventDefault();
                paymentView.style.display = 'none';
                calculatorView.style.display = 'block';
            });
        }
    }

    async function handlePaymentSubmission(e) {
        e.preventDefault();

        setLoading(true);

        const cardName = widget.querySelector('#card-name').value;
        if (!cardName) {
            showMessage('Please enter the name on your card.');
            setLoading(false);
            return;
        }

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                payment_method_data: {
                    billing_details: {
                        name: cardName,
                    },
                },
            },
            redirect: 'if_required'  // Changed from return_url to handle success in the widget
        });

        if (error) {
            showMessage(error.message);
            setLoading(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Hide payment view and show success view
            const paymentView = widget.querySelector('.payment-view');
            const successView = widget.querySelector('.success-view');
            
            if (paymentView && successView) {
                paymentView.style.display = 'none';
                successView.style.display = 'block';
            }
        }
    }

    function setLoading(isLoading) {
        const submitButton = widget.querySelector('#submit-payment');
        const spinner = widget.querySelector('#spinner');
        const buttonText = widget.querySelector('#button-text');

        if (submitButton && spinner && buttonText) {
            if (isLoading) {
                submitButton.disabled = true;
                spinner.style.display = 'inline-block';
                buttonText.style.display = 'none';
            } else {
                submitButton.disabled = false;
                spinner.style.display = 'none';
                buttonText.style.display = 'inline-block';
            }
        }
    }

    function showMessage(messageText) {
        const messageContainer = widget.querySelector('#payment-message');
        if (messageContainer) {
            messageContainer.textContent = messageText;
            messageContainer.style.display = 'block';
            setTimeout(() => {
                messageContainer.style.display = 'none';
                messageContainer.textContent = '';
            }, 4000);
        }
    }
}

let stripe;
let elements;
let paymentElement;

async function initializeStripe() {
  // Load Stripe.js
  const stripeScript = document.createElement('script');
  stripeScript.src = 'https://js.stripe.com/v3/';
  document.head.appendChild(stripeScript);

  await new Promise(resolve => stripeScript.onload = resolve);

  // Initialize Stripe with the same key
  stripe = Stripe('pk_test_51QrDDBDCFS4sGBlEhdnhx2eN3J3SO2VWoyhZd5IkFphglGQG97FxaBMxdXNqH4eiDKzCUoQNqgUyZnQN7PWphZNm00I3pBTYW4');
}

// Initialize Stripe when the widget loads
initializeStripe();

// Create widget HTML structure
function createWidgetStructure() {
    // ... existing code ...

    // Payment view (initially hidden)
    const paymentView = document.createElement('div');
    paymentView.className = 'widget-view payment-view';
    paymentView.innerHTML = `
        <div class="payment-container">
            <h2>Complete your payment</h2>
            <form id="payment-form">
                <div id="card-name-container">
                    <label for="card-name">Name on card</label>
                    <input id="card-name" type="text" placeholder="Name on card" required>
                </div>
                <div id="payment-element">
                    <!-- Stripe Elements will be mounted here -->
                </div>
                <button id="submit-payment" class="payment-button">
                    <div class="spinner" id="spinner"></div>
                    <span id="button-text">Pay now</span>
                </button>
                <div id="payment-message"></div>
            </form>
        </div>
    `;

    // ... rest of the existing code ...
}

function injectStyles() {
    const styles = `
        /* Payment view styles */
        .terra-tag-widget .payment-container {
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .terra-tag-widget .payment-container h2 {
            color: #1b4c57;
            font-size: 1.5rem;
            margin-bottom: 24px;
            text-align: center;
        }

        .terra-tag-widget #payment-form {
            display: block;
        }

        .terra-tag-widget #card-name-container {
            margin-bottom: 20px;
        }

        .terra-tag-widget #card-name {
            width: 100%;
            padding: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 16px;
        }

        .terra-tag-widget #payment-element {
            margin-bottom: 24px;
        }

        .terra-tag-widget .payment-button {
            background: #1b4c57;
            color: #ffffff;
            border: none;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            display: block;
            transition: all 0.2s ease;
            width: 100%;
        }

        .terra-tag-widget .payment-button:hover {
            background: #163f48;
        }

        .terra-tag-widget .payment-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .terra-tag-widget .spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .terra-tag-widget #payment-message {
            color: #dc2626;
            font-size: 14px;
            line-height: 20px;
            padding-top: 12px;
            text-align: center;
        }
    `;

    // ... rest of the existing code ...
}

// ... existing code ... 