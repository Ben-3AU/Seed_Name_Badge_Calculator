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

// Root route - serve demo page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Terra Tag Calculator Demo</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .demo-container {
                    margin: 40px 0;
                }
                pre {
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
            </style>
        </head>
        <body>
            <h1>Terra Tag Calculator Demo</h1>
            <p>This page demonstrates the Terra Tag Calculator widget integration.</p>
            
            <div class="demo-container">
                <h2>Live Demo</h2>
                <div id="terra-tag-calculator"></div>
            </div>

            <h2>Integration Code</h2>
            <pre><code>&lt;div id="terra-tag-calculator"&gt;&lt;/div&gt;
&lt;script&gt;
window.TERRA_TAG_WIDGET_CONFIG = {
    baseUrl: '${req.protocol}://${req.get('host')}'
};
&lt;/script&gt;
&lt;script src="${req.protocol}://${req.get('host')}/widget.js"&gt;&lt;/script&gt;</code></pre>

            <script>
            window.TERRA_TAG_WIDGET_CONFIG = {
                baseUrl: '${req.protocol}://${req.get('host')}'
            };
            </script>
            <script src="${req.protocol}://${req.get('host')}/widget.js"></script>
        </body>
        </html>
    `);
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