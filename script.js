console.log('Debug: script.js starting to load');

// Initialize Supabase
const supabaseUrl = 'https://pxxqvjxmzmsqunrhegcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4eHF2anhtem1zcXVucmhlZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDk0NTcsImV4cCI6MjA1NDAyNTQ1N30.5CUbSb2OR9H4IrGHx_vxmIPZCWN8x7TYoG5RUeYAehM';
let supabase = null;

// Initialize Stripe
const stripe = Stripe('pk_test_51PU4PWDRhweuWrjAIEn0yBzEVZcmma899ZgJUoQZNQIy1touh9oAcj2iWfj09jRHwxGHaL9X4PYmUcuhKtnpnyax00FEtBPeAb');

// Initialize Supabase client
try {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully');
} catch (error) {
    console.error('Error initializing Supabase client:', error);
}

// Core calculation functions
function calculateTotalQuantity() {
    const withGuests = parseInt(document.getElementById('quantityWithGuests').value) || 0;
    const withoutGuests = parseInt(document.getElementById('quantityWithoutGuests').value) || 0;
    return withGuests + withoutGuests;
}

function getSelectedValue(name) {
    const selected = document.querySelector(`.option-button.selected[data-name="${name}"]`);
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
    const warningDiv = document.getElementById('minimumQuantityWarning');
    const totalPriceDiv = document.getElementById('totalPrice');
    const actionButtons = document.getElementById('actionButtons');
    const emailQuoteForm = document.getElementById('emailQuoteForm');
    const orderForm = document.getElementById('orderForm');

    // Always show the totalPrice div, but update its content based on quantity
    totalPriceDiv.style.display = 'block';

    if (totalQuantity < 75) {
        warningDiv.style.display = 'none'; // Hide the warning above
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

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Prevent form submission
    const form = document.getElementById('calculatorForm');
    form.addEventListener('submit', e => e.preventDefault());

    // Add quantity input listeners
    document.getElementById('quantityWithGuests').addEventListener('input', updateDisplay);
    document.getElementById('quantityWithoutGuests').addEventListener('input', updateDisplay);

    // Add button click listeners for all option buttons
    document.querySelectorAll('.option-button').forEach(button => {
        button.addEventListener('click', e => {
            e.preventDefault();
            const buttonGroup = e.target.closest('.button-group');
            buttonGroup.querySelectorAll('.option-button').forEach(btn => {
                btn.classList.remove('selected');
            });
            e.target.classList.add('selected');
            updateDisplay();
            // If this is a paper type button, validate the order form
            if (e.target.getAttribute('data-name') === 'paperType') {
                validateOrderForm();
            }
        });
    });

    // Add email quote button handler
    const emailQuoteBtn = document.getElementById('emailQuoteBtn');
    const orderNowBtn = document.getElementById('orderNowBtn');
    const emailQuoteForm = document.getElementById('emailQuoteForm');
    const orderForm = document.getElementById('orderForm');
    const submitQuoteBtn = document.getElementById('submitQuoteBtn');
    const payNowBtn = document.getElementById('payNowBtn');

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

    // Add form validation listeners
    emailQuoteForm.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', validateEmailQuoteForm);
    });

    orderForm.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', validateOrderForm);
    });

    // Add submit handlers
    submitQuoteBtn.addEventListener('click', handleQuoteSubmission);
    payNowBtn.addEventListener('click', handleOrderSubmission);

    // Initial display update
    updateDisplay();
});

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to validate email quote form
function validateEmailQuoteForm() {
    const firstName = document.getElementById('quoteFirstName').value.trim();
    const email = document.getElementById('quoteEmail').value.trim();
    submitQuoteBtn.disabled = !(firstName && isValidEmail(email));
}

// Function to validate order form
function validateOrderForm() {
    const firstName = document.getElementById('orderFirstName').value.trim();
    const lastName = document.getElementById('orderLastName').value.trim();
    const company = document.getElementById('orderCompany').value.trim();
    const email = document.getElementById('orderEmail').value.trim();
    const paperType = getSelectedValue('paperType');
    payNowBtn.disabled = !(firstName && lastName && company && isValidEmail(email) && paperType);
}

// Function to save quote to Supabase
async function saveQuote(quoteData) {
    try {
        console.log('Attempting to save quote:', quoteData);
        
        const { created_at, ...quoteDataWithoutTimestamp } = quoteData;
        
        const { data, error } = await supabase
            .from('seed_name_badge_quotes')
            .insert([quoteDataWithoutTimestamp]);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        console.log('Quote saved to Supabase:', data);
        return data;
    } catch (error) {
        console.error('Error saving quote:', error);
        throw error;
    }
}

// Function to save order to Supabase
async function saveOrder(orderData) {
    try {
        console.log('Attempting to save order to Supabase:', orderData);
        
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select();

        if (error) {
            console.error('Supabase error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }
        
        console.log('Order saved successfully:', data);
        return { data, error };
    } catch (error) {
        console.error('Detailed error saving order:', {
            message: error.message,
            name: error.name,
            code: error.code,
            details: error.details
        });
        throw error;
    }
}

// Function to handle quote submission
async function handleQuoteSubmission(event) {
    event.preventDefault();
    
    const totalCost = calculateTotalPrice();
    const gstAmount = calculateGST(totalCost);
    
    const quoteData = {
        quantity_with_guests: parseInt(quantityWithGuests.value) || 0,
        quantity_without_guests: parseInt(quantityWithoutGuests.value) || 0,
        size: getSelectedValue('size'),
        printed_sides: getSelectedValue('printedSides'),
        ink_coverage: getSelectedValue('inkCoverage'),
        lanyards: getSelectedValue('lanyards') === 'yes',
        shipping: getSelectedValue('shipping'),
        first_name: document.getElementById('quoteFirstName').value.trim(),
        email: document.getElementById('quoteEmail').value.trim(),
        total_quantity: calculateTotalQuantity(),
        total_cost: Number(totalCost.toFixed(2)),
        gst_amount: Number(gstAmount.toFixed(2)),
        co2_savings: calculateCO2Savings(),
        email_sent: false
    };

    try {
        console.log('Attempting to save quote with data:', quoteData);
        
        // Remove created_at from quoteData
        const { created_at, ...quoteDataWithoutTimestamp } = quoteData;
        
        // Try to insert the quote without created_at
        let { data: savedQuote, error: insertError } = await supabase
            .from('seed_name_badge_quotes')
            .insert([quoteDataWithoutTimestamp])
            .select()
            .single();

        // If we get a duplicate key error, try to update instead
        if (insertError && insertError.code === '23505') {
            console.log('Quote exists, attempting update...');
            const { data: existingQuotes, error: fetchError } = await supabase
                .from('seed_name_badge_quotes')
                .select('id')
                .eq('email', quoteData.email)
                .eq('first_name', quoteData.first_name)
                .order('created_at', { ascending: false })
                .limit(1);

            if (fetchError) throw fetchError;
            
            if (existingQuotes && existingQuotes.length > 0) {
                const { data: updatedQuote, error: updateError } = await supabase
                    .from('seed_name_badge_quotes')
                    .update(quoteDataWithoutTimestamp)
                    .eq('id', existingQuotes[0].id)
                    .select()
                    .single();
                
                if (updateError) throw updateError;
                savedQuote = updatedQuote;
            }
        } else if (insertError) {
            throw insertError;
        }

        if (!savedQuote) {
            throw new Error('No data returned after saving quote');
        }

        console.log('Quote saved to Supabase:', savedQuote);

        // Submit for email processing
        const response = await fetch('/api/submit-quote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(savedQuote)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process quote');
        }

        const emailResult = await response.json();
        console.log('Email processing result:', emailResult);

        // Show success message
        const successMessage = document.getElementById('quoteSuccessMessage');
        successMessage.classList.add('visible');
        setTimeout(() => {
            successMessage.classList.remove('visible');
        }, 3000);
        
    } catch (error) {
        console.error('Detailed error processing quote:', error);
    }
}

// Function to handle order submission
async function handleOrderSubmission(event) {
    event.preventDefault();
    
    const totalCost = calculateTotalPrice();
    const gstAmount = calculateGST(totalCost);
    
    const orderData = {
        quantity_with_guests: parseInt(quantityWithGuests.value) || 0,
        quantity_without_guests: parseInt(quantityWithoutGuests.value) || 0,
        size: getSelectedValue('size'),
        printed_sides: getSelectedValue('printedSides'),
        ink_coverage: getSelectedValue('inkCoverage'),
        lanyards: getSelectedValue('lanyards') === 'yes',
        shipping: getSelectedValue('shipping'),
        paper_type: getSelectedValue('paperType'),
        first_name: document.getElementById('orderFirstName').value.trim(),
        last_name: document.getElementById('orderLastName').value.trim(),
        company: document.getElementById('orderCompany').value.trim(),
        email: document.getElementById('orderEmail').value.trim(),
        total_quantity: calculateTotalQuantity(),
        total_cost: Number(totalCost.toFixed(2)),
        gst_amount: Number(gstAmount.toFixed(2)),
        co2_savings: calculateCO2Savings(),
        payment_status: 'pending',
        email_sent: false
    };

    try {
        const payNowBtn = document.getElementById('payNowBtn');
        payNowBtn.disabled = true;
        
        // Create a payment intent
        const response = await fetch('/api/create-payment-intent', {
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
        console.log('Payment intent created:', result);

        // Redirect to payment page
        window.location.href = result.url;
    } catch (error) {
        console.error('Error processing order:', error);
        const payNowBtn = document.getElementById('payNowBtn');
        payNowBtn.disabled = false;
        alert('Error processing order: ' + (error.message || 'Unknown error'));
    }
}

console.log('Debug: script.js finished loading'); 