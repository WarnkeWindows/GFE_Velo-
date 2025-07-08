// eventHandler.js for gfeHomePage iframe

// IMPORTANT: For production, replace '*' with your actual Wix site URL (e.g., 'https://www.goodfaithexteriors.com').
// This ensures that messages are only sent to and received from your trusted domain, preventing potential security issues.
// Source: [1, 18, 22, 23, 33, 34]
const TARGET_ORIGIN = '*'; // Consider changing this to your specific Wix domain for production.

/**
 * Helper function to send messages to the parent Wix page.
 * This function encapsulates the `window.parent.postMessage()` API call,
 * which is the standard method for communication from an iframe to its parent.
 * Source: [1, 2, 4, 5, 12-16, 19, 20, 22]
 * @param {object} message The data object to send. GFE's system uses a structured format
 *                         with properties like `type`, `functionName`, and `payload`.
 */
function sendMessageToParent(message) {
    if (window.parent) {
        window.parent.postMessage(message, TARGET_ORIGIN);
        console.log('Message sent from gfeHomePage iframe:', message); // console.log is a common debugging tool [21, 35-37]
    } else {
        console.warn('No parent window found to send message from gfeHomePage.');
    }
}

/**
 * Sets up all necessary event listeners for interactive elements within the gfeHomePage iframe.
 * This function is called once the DOM is fully loaded to ensure all HTML elements are available.
 * It uses `addEventListener()`, the recommended modern way to attach event handlers.
 * Source: [2, 34, 38-47]
 */
function setupIframeEventListeners() {
    document.addEventListener('DOMContentLoaded', () => { // Ensures script runs after HTML content is parsed [24]
        const startEstimateButton = document.getElementById('startEstimateButton');
        const browseProductsButton = document.getElementById('browseProductsButton');

        // Event listener for the "Start Estimate" button.
        if (startEstimateButton) {
            startEstimateButton.addEventListener('click', () => {
                console.log('Start Estimate button clicked in gfeHomePage iframe.');
                // Sends a 'navigateTo' message to the parent Wix page.
                // The parent's `wix-page-integration.js` script has a `handleNavigation` function
                // that processes such messages to switch the active iframe or navigate the page.
                // Source: [23, 48, 49]
                sendMessageToParent({
                    type: 'navigateTo', // Standardized message type for navigation within GFE [23, 48]
                    page: 'quote-calculator' // Directs the parent to open the window estimator [13, 48, 49]
                });
            });
        }

        // Event listener for the "Browse Products" button.
        if (browseProductsButton) {
            browseProductsButton.addEventListener('click', () => {
                console.log('Browse Products button clicked in gfeHomePage iframe.');
                // Sends a 'navigateTo' message to the parent Wix page to display the product browser.
                // Source: [13, 23, 48, 50]
                sendMessageToParent({
                    type: 'navigateTo',
                    page: 'product-browser' // Directs the parent to open the product browser [13, 48, 50]
                });
            });
        }
    });

    /**
     * Listens for messages coming from the parent Wix page.
     * This `window.addEventListener('message', ...)` is how the iframe receives data or commands
     * from the Velo backend via the parent Wix page.
     * Source: [1, 2, 12-16, 19, 20, 22, 23, 34]
     */
    window.addEventListener('message', (event) => {
        // SECURITY CHECK: Crucially, validate the message origin in a production environment.
        // This prevents malicious external websites from sending fake messages to your iframe.
        // Source: [1, 18, 22, 23, 33, 34]
        // if (event.origin !== 'https://your-wix-site-domain.com') {
        //     console.warn('Message received from untrusted origin in gfeHomePage iframe:', event.origin);
        //     return; // Discard messages from untrusted origins
        // }

        const { type, data, functionName, error, collectionName } = event.data; // Destructure standard message format [1, 2, 13, 15, 16, 23]

        console.log(`gfeHomePage Iframe received message of type: ${type}`, event.data);

        switch (type) {
            case 'setInitialData':
                // This case handles general data sent from the parent to initialize the iframe.
                // The homepage might receive initial configuration settings, user details, etc.
                console.log('Received initial data from parent:', data);
                // (Add logic here to use the received data, e.g., update UI or internal state)
                break;
            case 'veloFunctionResult':
                // This type of message is sent by the parent Wix page to deliver results
                // from a Velo backend function call (e.g., `calculateQuote`, `getWindowProducts`).
                // Source: [34, 51] While the homepage doesn't typically *call* such functions directly,
                // it's part of the general iframe communication pattern.
                if (error) {
                    console.error(`Error for Velo function "${functionName}" in gfeHomePage:`, error.message);
                    // (Add logic to display this error to the user if relevant)
                } else {
                    console.log(`Result for Velo function "${functionName}" received in gfeHomePage:`, data);
                    // (Process the returned data from the Velo backend)
                }
                break;
            case 'collectionDataResult':
                // Similar to `veloFunctionResult`, this is for data fetched from Wix database collections.
                // Source: [52]
                if (error) {
                    console.error(`Error fetching collection data for "${collectionName}" in gfeHomePage:`, error);
                } else {
                    console.log(`Collection data for "${collectionName}" received in gfeHomePage:`, data.items);
                }
                break;
            // Add other specific message types the homepage might expect or handle in the future.
            default:
                console.log('Unhandled message type in gfeHomePage:', type);
        }
    });
}

// Initialize all event listeners for the gfeHomePage iframe when this script loads.
setupIframeEventListeners();