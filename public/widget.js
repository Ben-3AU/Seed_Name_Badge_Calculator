// Terra Tag Calculator Widget
(function() {
    console.log('Widget script loaded and executing');

    // Configuration
    const config = {
        BASE_URL: window.TERRA_TAG_WIDGET_CONFIG?.baseUrl || 'https://seed-name-badge-calculator.vercel.app',
        BYPASS_TOKEN: window.TERRA_TAG_WIDGET_CONFIG?.bypassToken
    };
    console.log('Widget configuration:', { ...config, bypassToken: config.BYPASS_TOKEN ? '[PRESENT]' : '[NOT SET]' });

    // Helper function to add bypass token
    async function fetchWithBypass(url, options = {}) {
        if (config.BYPASS_TOKEN) {
            options.headers = {
                ...options.headers,
                'x-vercel-protection-bypass': config.BYPASS_TOKEN
            };
        }
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    }

    // Create a simple test element
    const container = document.getElementById('terra-tag-calculator');
    if (!container) {
        console.error('Terra Tag Calculator container not found');
        return;
    }
    console.log('Widget container found');

    // Add a test message
    container.innerHTML = `
        <div style="padding: 20px; background: #f0f0f0; border-radius: 8px;">
            <h2>Terra Tag Calculator Widget</h2>
            <p>Loading from: ${config.BASE_URL}</p>
            <p>Protection bypass: ${config.BYPASS_TOKEN ? 'Enabled' : 'Disabled'}</p>
            <p>Script loaded successfully!</p>
        </div>
    `;

    // Test API connection
    fetchWithBypass(`${config.BASE_URL}/api/config`)
        .then(response => response.json())
        .then(data => {
            console.log('API connection successful:', data);
            container.innerHTML += '<p style="color: green;">✓ API connection successful</p>';
        })
        .catch(error => {
            console.error('API connection failed:', error);
            container.innerHTML += '<p style="color: red;">✗ API connection failed</p>';
        });

    // Log success
    console.log('Terra Tag Calculator Widget initialized successfully');
})(); 