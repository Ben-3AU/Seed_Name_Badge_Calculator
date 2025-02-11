const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { sendQuoteEmail, sendOrderConfirmationEmail, generateOrderPDF } = require('./emailService');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration');
    process.exit(1);
}

// Log environment variables (without exposing full keys)
console.log('Environment variables loaded:', {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing',
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ? 'Present' : 'Missing',
    CLIENT_URL: process.env.CLIENT_URL
});

// Initialize Stripe with the secret key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['https://seed-name-badge-calculator.vercel.app', process.env.CLIENT_URL].filter(Boolean),
    credentials: true
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Test endpoint to verify Stripe connection
app.get('/test-stripe', async (req, res) => {
    try {
        const paymentMethods = await stripe.paymentMethods.list({
            limit: 1,
            type: 'card'
        });
        res.json({ status: 'Stripe connection successful' });
    } catch (error) {
        console.error('Stripe connection test failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle quote email submission
app.post('/api/submit-quote', async (req, res) => {
    try {
        const quoteData = req.body;
        console.log('Received quote data:', quoteData);
        
        // Try to find existing quote
        const { data: existingQuotes, error: fetchError } = await supabase
            .from('seed_name_badge_quotes')
            .select('*')
            .eq('email', quoteData.email)
            .eq('first_name', quoteData.first_name)
            .order('created_at', { ascending: false })
            .limit(1);

        if (fetchError) {
            console.error('Error fetching existing quote:', fetchError);
            throw fetchError;
        }

        let savedQuote;
        if (existingQuotes && existingQuotes.length > 0) {
            // Update existing quote
            console.log('Updating existing quote');
            const { data, error: updateError } = await supabase
                .from('seed_name_badge_quotes')
                .update({
                    ...quoteData,
                    email_sent: false
                })
                .eq('id', existingQuotes[0].id)
                .select()
                .single();

            if (updateError) throw updateError;
            savedQuote = data;
        } else {
            // Insert new quote
            console.log('Creating new quote');
            const { data, error: insertError } = await supabase
                .from('seed_name_badge_quotes')
                .insert([{
                    ...quoteData,
                    email_sent: false
                }])
                .select()
                .single();

            if (insertError) throw insertError;
            savedQuote = data;
        }

        console.log('Quote saved successfully:', savedQuote);

        // Send quote email
        try {
            console.log('Attempting to send email...');
            await sendQuoteEmail(savedQuote);
            console.log('Email sent successfully');

            // Update quote record to mark email as sent
            const { error: updateError } = await supabase
                .from('seed_name_badge_quotes')
                .update({ email_sent: true })
                .eq('id', savedQuote.id);

            if (updateError) {
                console.error('Error updating quote email status:', updateError);
            }

            res.json({ 
                success: true, 
                message: 'Quote submitted and email sent',
                quote: savedQuote
            });
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Even if email fails, we still return success for the quote submission
            res.json({ 
                success: true, 
                message: 'Quote submitted but email failed to send',
                quote: savedQuote,
                emailError: emailError.message
            });
        }
    } catch (error) {
        console.error('Error processing quote:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.details || null
        });
    }
});

// Create a Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { orderData } = req.body;
        console.log('Received order data:', orderData);
        
        if (!orderData || !orderData.total_cost) {
            throw new Error('Invalid order data: missing total_cost');
        }

        // First create the order in Supabase
        const { data: order, error: orderError } = await supabase
            .from('seed_name_badge_orders')
            .insert([{
                quantity_with_guests: orderData.quantity_with_guests,
                quantity_without_guests: orderData.quantity_without_guests,
                size: orderData.size,
                printed_sides: orderData.printed_sides,
                ink_coverage: orderData.ink_coverage,
                lanyards: orderData.lanyards,
                shipping: orderData.shipping,
                paper_type: orderData.paper_type,
                first_name: orderData.first_name,
                last_name: orderData.last_name,
                company: orderData.company,
                email: orderData.email,
                total_quantity: orderData.total_quantity,
                total_cost: orderData.total_cost,
                gst_amount: orderData.gst_amount,
                co2_savings: Number(orderData.co2_savings.toFixed(2)),
                payment_status: 'pending',
                email_sent: false,
                stripe_payment_id: null,
                pdf_url: null
            }])
            .select()
            .single();

        if (orderError) {
            throw orderError;
        }

        console.log('Created order:', order);
        console.log('Creating payment intent with amount:', Math.round(orderData.total_cost * 100));
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(orderData.total_cost * 100),
            currency: 'aud',
            metadata: {
                order_id: order.id,
                email: orderData.email,
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        console.log('Payment intent created:', {
            id: paymentIntent.id,
            client_secret: paymentIntent.client_secret ? 'present' : 'missing'
        });

        // Update order with payment intent ID
        const { error: updateError } = await supabase
            .from('seed_name_badge_orders')
            .update({ stripe_payment_id: paymentIntent.id })
            .eq('id', order.id);

        if (updateError) {
            console.error('Error updating order with payment intent:', updateError);
        }

        // Redirect URL with payment intent client secret and order ID
        const redirectUrl = `/payment.html?payment_intent_client_secret=${paymentIntent.client_secret}&order_id=${order.id}`;
        
        res.json({ url: redirectUrl });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify the payment status and send confirmation
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { paymentIntentId, orderId } = req.body;
        console.log('Verifying payment for order:', orderId, 'with payment intent:', paymentIntentId);
        
        // Verify payment status with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        console.log('Payment intent status:', paymentIntent.status);
        
        if (paymentIntent.status === 'succeeded') {
            console.log('Payment succeeded, updating order status...');
            
            try {
                // Step 1: First verify the order exists
                console.log('Verifying order exists...');
                const { data: existingOrder, error: fetchError } = await supabase
                    .from('seed_name_badge_orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();

                if (fetchError) {
                    console.error('Error fetching order:', fetchError);
                    throw new Error(`Order ${orderId} not found`);
                }

                // Step 2: Update payment status
                console.log('Updating payment status...');
                
                // Log the update we're attempting
                const updateData = {
                    payment_status: 'completed',
                    stripe_payment_id: paymentIntentId,
                    email_sent: false
                };
                console.log('Attempting to update order with:', updateData);

                // Perform simple update
                const { data: updateResult, error: updateError } = await supabase
                    .from('seed_name_badge_orders')
                    .update(updateData)
                    .eq('id', orderId)
                    .eq('payment_status', 'pending')  // Only update if status is pending
                    .select();

                if (updateError) {
                    console.error('Update failed:', updateError);
                    throw new Error('Failed to update payment status: ' + updateError.message);
                }

                console.log('Raw update response:', { data: updateResult, error: updateError });

                if (!updateResult || updateResult.length === 0) {
                    console.error('No rows were updated');
                    
                    // Check current permissions
                    const { data: roleData, error: roleError } = await supabase.rpc('get_my_claims');
                    console.log('Current role/claims:', roleData, roleError);
                    
                    // Double check if order exists and its current state
                    const { data: checkOrder, error: checkError } = await supabase
                        .from('seed_name_badge_orders')
                        .select('*')
                        .eq('id', orderId)
                        .single();
                        
                    if (checkError) {
                        console.error('Error checking order:', checkError);
                        throw new Error('Failed to verify order state: ' + checkError.message);
                    } else {
                        console.log('Current order state:', checkOrder);
                        // Try one more time with a different approach
                        const { data: retryResult, error: retryError } = await supabase
                            .from('seed_name_badge_orders')
                            .update(updateData)
                            .match({ id: orderId })
                            .select();
                            
                        if (retryError || !retryResult || retryResult.length === 0) {
                            console.error('Retry update failed:', retryError);
                            throw new Error('Failed to update payment status after retry');
                        } else {
                            console.log('Retry update succeeded:', retryResult);
                            updateResult = retryResult;
                        }
                    }
                }

                // Use the updated order data
                const orderData = updateResult[0];
                console.log('Order updated successfully:', orderData);

                // Step 4: Send confirmation email
                console.log('Sending confirmation email...');
                await sendOrderConfirmationEmail(orderData);
                console.log('Confirmation email sent successfully');

                // Step 5: Update email and PDF status
                console.log('Updating email status...');
                await supabase
                    .from('seed_name_badge_orders')
                    .update({
                        email_sent: true,
                        pdf_url: `${orderId}.pdf`
                    })
                    .match({ id: orderId });

                // Return success response
                res.json({ 
                    success: true, 
                    order: orderData,
                    message: 'Payment processed and email sent successfully'
                });

            } catch (error) {
                console.error('Error in payment verification process:', error);
                res.status(500).json({ 
                    error: error.message,
                    details: error.details || null
                });
            }
        } else {
            console.log('Payment not succeeded:', paymentIntent.status);
            res.json({ success: false, status: paymentIntent.status });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get order details
app.get('/api/get-order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const { data: order, error } = await supabase
            .from('seed_name_badge_orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (error) {
            throw error;
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test endpoint to generate and view a PDF
app.get('/test-pdf', async (req, res) => {
    try {
        console.log('Starting test PDF generation...');
        
        const sampleOrderData = {
            id: 'TEST-123',
            first_name: 'John',
            last_name: 'Doe',
            company: 'Test Company',
            email: 'test@example.com',
            quantity_with_guests: 50,
            quantity_without_guests: 25,
            total_quantity: 75,
            size: 'A7',
            printed_sides: 'double',
            ink_coverage: 'over40',
            lanyards: true,
            shipping: 'standard',
            paper_type: 'mixedHerb',
            total_cost: 499.99,
            gst_amount: 45.45,
            co2_savings: 8.25,
            created_at: new Date().toISOString()
        };

        console.log('Generating PDF...');
        const pdfPath = await generateOrderPDF(sampleOrderData);
        console.log('PDF generated at:', pdfPath);

        if (!fs.existsSync(pdfPath)) {
            console.error('Generated PDF file not found at:', pdfPath);
            throw new Error('Generated PDF file not found');
        }

        // Set the content type to PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=test-order.pdf');
        
        // Read the file and send it directly
        const fileStream = fs.createReadStream(pdfPath);
        fileStream.on('error', (error) => {
            console.error('Error reading PDF file:', error);
            res.status(500).send('Error reading PDF file');
        });

        fileStream.pipe(res);

        // Clean up the file after it's sent
        res.on('finish', () => {
            fs.unlink(pdfPath, (err) => {
                if (err) console.error('Error cleaning up PDF file:', err);
                else console.log('PDF file cleaned up successfully');
            });
        });
    } catch (error) {
        console.error('Error in test-pdf endpoint:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export the Express API
module.exports = app; 