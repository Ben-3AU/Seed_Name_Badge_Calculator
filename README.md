# Terra Tag Calculator Widget

A customizable widget for calculating Terra Tag name badge orders.

## Embedding the Widget

To embed the widget in your website, add the following code:

```html
<div id="terra-tag-calculator"></div>
<script>
window.TERRA_TAG_WIDGET_CONFIG = {
    baseUrl: 'YOUR_DEPLOYMENT_URL',
    bypassToken: 'YOUR_BYPASS_TOKEN' // Optional: Only needed for accessing preview deployments
};
</script>
<script src="YOUR_DEPLOYMENT_URL/widget.js"></script>
```

### Configuration Options

- `baseUrl`: The URL of your widget deployment
- `bypassToken`: (Optional) The Vercel Protection Bypass token for accessing preview deployments

### Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

### Environment Variables

The following environment variables are used:

- `VERCEL_AUTOMATION_BYPASS_SECRET`: Automatically set by Vercel for preview deployments
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anonymous key

See `.env.example` for all required environment variables.

### Preview Deployments

Preview deployments are protected by Vercel. To access them:

1. Get the Protection Bypass token from Vercel dashboard (Settings > Security > Protection Bypass for Automation)
2. Include the token in the widget configuration as shown above

Note: The bypass token should never be committed to the codebase or exposed publicly. 