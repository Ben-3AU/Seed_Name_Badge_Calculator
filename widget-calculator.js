// Calculator functionality
function initializeCalculator() {
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

    // Initial display update
    updateDisplay();
} 