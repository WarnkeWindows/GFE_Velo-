/**
 * Good Faith Exteriors - Master Page Controller
 * Unified navigation and command center integration
 */

import wixLocation from 'wix-location';
import { authentication } from 'wix-members';
import { session } from 'wix-storage';

// Configuration for master page
const MASTER_CONFIG = {
    routes: {
        home: '/',
        estimator: '/good-faith-estimator',
        measure: '/ai-window-measure',
        products: '/window-products',
        schedule: '/schedule-appointment',
        contact: '/contact-us',
        admin: '/admin',
        portal: '/customer-portal'
    },
    commandCenter: {
        enabled: true,
        adminAccess: ['admin@goodfaithexteriors.com'],
        position: 'bottom-right'
    }
};

$w.onReady(function () {
    console.log('<à GFE Master Page Ready');
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize command center if enabled
    if (MASTER_CONFIG.commandCenter.enabled) {
        initializeCommandCenter();
    }
    
    // Setup authentication monitoring
    setupAuthenticationMonitoring();
});

function initializeNavigation() {
    // Setup main navigation buttons
    if ($w('#homeBtn')) {
        $w('#homeBtn').onClick(() => navigateToPage('home'));
    }
    
    if ($w('#estimatorBtn')) {
        $w('#estimatorBtn').onClick(() => navigateToPage('estimator'));
    }
    
    if ($w('#productsBtn')) {
        $w('#productsBtn').onClick(() => navigateToPage('products'));
    }
    
    if ($w('#contactBtn')) {
        $w('#contactBtn').onClick(() => navigateToPage('contact'));
    }
    
    // Mobile menu toggle
    if ($w('#mobileMenuBtn')) {
        $w('#mobileMenuBtn').onClick(() => toggleMobileMenu());
    }
}

function initializeCommandCenter() {
    // Load command center widget if user has access
    authentication.getCurrentUser()
        .then((user) => {
            if (user && MASTER_CONFIG.commandCenter.adminAccess.includes(user.email)) {
                loadCommandCenterWidget();
            }
        })
        .catch((error) => {
            console.log('User not authenticated or command center access denied');
        });
}

function loadCommandCenterWidget() {
    // Add command center to page
    const commandCenterContainer = $w('#commandCenterContainer');
    if (commandCenterContainer) {
        commandCenterContainer.show();
        
        // Initialize the NotebookLM Command Center
        window.loadNotebookLMCommandCenter = () => {
            import('/src/widgets/NotebookLMCommandCenter.js')
                .then(module => {
                    const NotebookLMCommandCenter = module.default;
                    // Mount the component
                    commandCenterContainer.html = '<div id="notebook-command-center"></div>';
                })
                .catch(error => {
                    console.error('Failed to load command center:', error);
                });
        };
        
        window.loadNotebookLMCommandCenter();
    }
}

function setupAuthenticationMonitoring() {
    authentication.onLogin((user) => {
        console.log('User logged in:', user.id);
        session.setItem('gfeUser', JSON.stringify(user));
        
        // Refresh command center access
        if (MASTER_CONFIG.commandCenter.enabled) {
            initializeCommandCenter();
        }
        
        // Update UI for authenticated user
        updateUIForUser(user);
    });
    
    authentication.onLogout(() => {
        console.log('User logged out');
        session.removeItem('gfeUser');
        
        // Hide command center
        const commandCenterContainer = $w('#commandCenterContainer');
        if (commandCenterContainer) {
            commandCenterContainer.hide();
        }
        
        // Update UI for guest
        updateUIForGuest();
    });
}

function navigateToPage(pageKey) {
    const route = MASTER_CONFIG.routes[pageKey];
    if (route) {
        console.log(`Navigating to ${pageKey}: ${route}`);
        wixLocation.to(route);
    }
}

function toggleMobileMenu() {
    const mobileMenu = $w('#mobileMenu');
    if (mobileMenu) {
        if (mobileMenu.collapsed) {
            mobileMenu.expand();
        } else {
            mobileMenu.collapse();
        }
    }
}

function updateUIForUser(user) {
    // Show authenticated user elements
    const userElements = $w('#userProfile, #myEstimates, #customerPortal');
    userElements.forEach(element => {
        if (element) element.show();
    });
    
    // Hide guest elements
    const guestElements = $w('#loginBtn, #signupBtn');
    guestElements.forEach(element => {
        if (element) element.hide();
    });
    
    // Update user profile display
    const userNameDisplay = $w('#userName');
    if (userNameDisplay) {
        userNameDisplay.text = user.firstName || 'User';
    }
}

function updateUIForGuest() {
    // Hide authenticated user elements
    const userElements = $w('#userProfile, #myEstimates, #customerPortal');
    userElements.forEach(element => {
        if (element) element.hide();
    });
    
    // Show guest elements
    const guestElements = $w('#loginBtn, #signupBtn');
    guestElements.forEach(element => {
        if (element) element.show();
    });
}

// Export functions for page-specific use
export function showCommandCenter() {
    const commandCenterContainer = $w('#commandCenterContainer');
    if (commandCenterContainer) {
        commandCenterContainer.show();
    }
}

export function hideCommandCenter() {
    const commandCenterContainer = $w('#commandCenterContainer');
    if (commandCenterContainer) {
        commandCenterContainer.hide();
    }
}

export function refreshCommandCenter() {
    if (MASTER_CONFIG.commandCenter.enabled) {
        loadCommandCenterWidget();
    }
}