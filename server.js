const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: [
        'https://seed-name-badge-calculator-bens-projects-4af3578a.vercel.app',
        'https://seed-name-badge-calculator-git-master-bens-projects-4af3578a.vercel.app',
        'https://seed-name-badge-calculator.vercel.app',
        'https://www.terratag.com.au',
        'https://terratag.com.au'
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Initialize Supabase client
let supabase;
try {
    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
    );
} catch (error) {
    console.error('Supabase initialization error:', error);
}

// Basic health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

// Stripe configuration endpoint
app.get('/api/config', (req, res) => {
    try {
        if (!process.env.STRIPE_PUBLISHABLE_KEY) {
            throw new Error('Missing Stripe configuration');
        }
        res.json({
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
            supabaseUrl: process.env.SUPABASE_URL,
            supabaseKey: process.env.SUPABASE_ANON_KEY
        });
    } catch (error) {
        console.error('/api/config error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Export the Express app
module.exports = app; 