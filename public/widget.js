// Terra Tag Calculator Widget
(function() {
    console.log('[Terra Tag] Widget script loaded');

    function initWidget() {
        console.log('[Terra Tag] Initializing widget');

        // Configuration
        const config = {
            BASE_URL: window.TERRA_TAG_WIDGET_CONFIG?.baseUrl || 'https://seed-name-badge-calculator.vercel.app',
            BYPASS_TOKEN: window.TERRA_TAG_WIDGET_CONFIG?.bypassToken
        };
        console.log('[Terra Tag] Configuration:', { 
            baseUrl: config.BASE_URL,
            bypassToken: config.BYPASS_TOKEN ? 'Present' : 'Not set',
            windowConfig: !!window.TERRA_TAG_WIDGET_CONFIG
        });

        // Helper function to add bypass token
        async function fetchWithBypass(url, options = {}) {
            const headers = {
                'Content-Type': 'application/json',
                ...(config.BYPASS_TOKEN && {
                    'x-vercel-protection-bypass': config.BYPASS_TOKEN
                }),
                ...options.headers
            };
            
            console.log('[Terra Tag] Fetching:', {
                url,
                hasBypassToken: !!config.BYPASS_TOKEN,
                headers: Object.keys(headers)
            });

            const response = await fetch(url, { ...options, headers });
            console.log('[Terra Tag] Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        }

        // Create a simple test element
        const container = document.getElementById('terra-tag-calculator');
        if (!container) {
            console.error('[Terra Tag] Container element not found! Make sure you have a div with id="terra-tag-calculator"');
            return;
        }
        console.log('[Terra Tag] Container found');

        // Add a test message with timestamp
        container.innerHTML = `
            <div style="padding: 20px; background: #f0f0f0; border-radius: 8px; font-family: Arial, sans-serif;">
                <h2 style="margin: 0 0 15px 0;">Terra Tag Calculator Widget</h2>
                <p style="margin: 5px 0;">Loading from: ${config.BASE_URL}</p>
                <p style="margin: 5px 0;">Protection bypass: ${config.BYPASS_TOKEN ? 'Enabled' : 'Disabled'}</p>
                <p style="margin: 5px 0;">Script loaded at: ${new Date().toISOString()}</p>
                <div id="terra-tag-api-status" style="margin-top: 15px;">Testing API connection...</div>
            </div>
        `;

        // Test API connection
        const apiStatus = container.querySelector('#terra-tag-api-status');
        fetchWithBypass(`${config.BASE_URL}/api/config`)
            .then(response => response.json())
            .then(data => {
                console.log('[Terra Tag] API connection successful:', data);
                apiStatus.innerHTML = `
                    <p style="color: green; margin: 5px 0;">✓ API connection successful</p>
                    <pre style="font-size: 12px; margin-top: 10px; background: #fff; padding: 10px; border-radius: 4px;">${JSON.stringify(data, null, 2)}</pre>
                `;
            })
            .catch(error => {
                console.error('[Terra Tag] API connection failed:', error);
                apiStatus.innerHTML = `
                    <p style="color: red; margin: 5px 0;">✗ API connection failed</p>
                    <p style="font-size: 12px; margin-top: 10px;">Error: ${error.message}</p>
                `;
            });

        console.log('[Terra Tag] Widget initialization complete');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        console.log('[Terra Tag] Document still loading, waiting for DOMContentLoaded');
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        console.log('[Terra Tag] Document already loaded, initializing immediately');
        initWidget();
    }
})(); 