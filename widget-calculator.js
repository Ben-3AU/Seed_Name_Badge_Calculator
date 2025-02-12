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
    const stripe = Stripe('pk_test_51PU4PWDRhweuWrjAIEn0yBzEVZcmma899ZgJUoQZNQIy1touh9oAcj2iWfj09jRHwxGHaL9X4PYmUcuhKtnpnyax00FEtBPeAb');

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
            
            // Show payment view
            const calculatorView = widget.querySelector('.calculator-view');
            const paymentView = widget.querySelector('.payment-view');
            calculatorView.classList.remove('active');
            paymentView.classList.add('active');

            // Get client secret directly from the response
            const clientSecret = result.clientSecret;
            
            if (!clientSecret) {
                throw new Error('No client secret received from the server');
            }

            // Initialize payment form
            await initializePaymentElement(clientSecret);
            
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
    async function initializePaymentElement(clientSecret) {
        if (!clientSecret) {
            throw new Error('Client secret is required to initialize payment element');
        }

        const appearance = {
            theme: 'stripe',
            variables: {
                colorPrimary: '#1b4c57',
            },
        };

        elements = stripe.elements({ 
            appearance, 
            clientSecret
        });
        paymentElement = elements.create('payment');
        
        const paymentElementMount = widget.querySelector('#payment-element');
        if (paymentElementMount) {
            paymentElement.mount('#payment-element');
            
            const submitButton = widget.querySelector('#submit-payment');
            if (submitButton) {
                submitButton.addEventListener('click', handlePaymentSubmission);
            }
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

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${BASE_URL}/success.html`,
                payment_method_data: {
                    billing_details: {
                        name: cardName,
                    },
                },
            },
        });

        if (error) {
            showMessage(error.message);
            setLoading(false);
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
  stripe = Stripe('pk_test_51PU4PWDRhweuWrjAIEn0yBzEVZcmma899ZgJUoQZNQIy1touh9oAcj2iWfj09jRHwxGHaL9X4PYmUcuhKtnpnyax00FEtBPeAb');
}

// Initialize Stripe when the widget loads
initializeStripe();

// ... existing code ... 