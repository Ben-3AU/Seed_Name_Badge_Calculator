// Terra Tag Calculator Widget
(async function() {
    // Configuration
    const config = {
        BASE_URL: window.TERRA_TAG_WIDGET_CONFIG?.baseUrl || 'https://seed-name-badge-calculator.vercel.app'
    };

    // Create a simple test element
    const container = document.getElementById('terra-tag-calculator');
    if (!container) {
        console.error('Terra Tag Calculator container not found');
        return;
    }

    // Add a test message
    container.innerHTML = `
        <div style="padding: 20px; background: #f0f0f0; border-radius: 8px;">
            <h2>Terra Tag Calculator Widget</h2>
            <p>Loading from: ${config.BASE_URL}</p>
        </div>
    `;

    // Log success
    console.log('Terra Tag Calculator Widget initialized');
})(); 