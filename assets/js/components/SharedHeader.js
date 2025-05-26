// Shared Header Component
export class SharedHeader {
    constructor() {
        this.navElement = document.querySelector('nav.main-nav');
        if (!this.navElement) {
            this.createNav();
        }
        this.initializeTheme();
    }

    createNav() {
        // Create overlay for mobile menu
        const overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        overlay.id = 'navOverlay';
        
        // Create main nav
        const nav = document.createElement('nav');
        nav.className = 'main-nav';
        
        nav.innerHTML = `
            <div class="nav-brand">WakeWell</div>
            <div class="nav-controls">
                <button id="menuToggle" class="menu-toggle" aria-label="Toggle menu">
                    <span></span>
                </button>
            </div>
            <div class="nav-links" style="left: -100%;">
                <div class="nav-header">
                    <div class="nav-brand">WakeWell</div>
                    <button class="close-menu" aria-label="Close menu">×</button>
                </div>
                <div class="nav-items">
                    <a href="/" class="nav-item ${window.location.pathname === '/' ? 'active' : ''}">
                        <span class="nav-icon">🏠</span>
                        <span class="nav-text">Home</span>
                    </a>
                    <a href="/pages/alarm.html" class="nav-item ${window.location.pathname.includes('alarm.html') ? 'active' : ''}">
                        <span class="nav-icon">⏰</span>
                        <span class="nav-text">Alarm</span>
                    </a>
                    <a href="/pages/tracking.html" class="nav-item ${window.location.pathname.includes('tracking.html') ? 'active' : ''}">
                        <span class="nav-icon">😴</span>
                        <span class="nav-text">Sleep</span>
                    </a>
                    <a href="/pages/reports.html" class="nav-item ${window.location.pathname.includes('reports.html') ? 'active' : ''}">
                        <span class="nav-icon">📊</span>
                        <span class="nav-text">Reports</span>
                    </a>
                    <a href="/pages/settings.html" class="nav-item ${window.location.pathname.includes('settings.html') ? 'active' : ''}">
                        <span class="nav-icon">⚙️</span>
                        <span class="nav-text">Settings</span>
                    </a>
                </div>
                <div class="theme-toggle-container">
                    <button id="themeToggle" class="theme-toggle" aria-label="Toggle light/dark theme">
                        <span class="theme-icon">🌙</span>
                        <span class="theme-text">Toggle Theme</span>
                    </button>
                </div>
            </div>
        `;
        
        // Insert elements into the DOM
        document.body.insertBefore(overlay, document.body.firstChild);
        document.body.insertBefore(nav, document.body.firstChild);
        
        // Initialize mobile menu
        this.initMobileMenu();
    }
    
    initMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.querySelector('.nav-links');
        const navOverlay = document.getElementById('navOverlay');
        const closeButton = document.querySelector('.close-menu');
        
        if (menuToggle && navLinks && navOverlay && closeButton) {
            // Toggle menu function
            const toggleMenu = (open = null) => {
                const shouldOpen = open !== null ? open : !navLinks.classList.contains('active');
                
                if (shouldOpen) {
                    navLinks.classList.add('active');
                    navOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    menuToggle.classList.add('active');
                } else {
                    navLinks.classList.remove('active');
                    navOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                    menuToggle.classList.remove('active');
                }
            };
            
            // Toggle menu on button click
            menuToggle.addEventListener('click', () => toggleMenu());
            
            // Close menu when clicking close button
            closeButton.addEventListener('click', () => toggleMenu(false));
            
            // Close menu when clicking overlay
            navOverlay.addEventListener('click', () => toggleMenu(false));
            
            // Close menu when clicking on a link
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => toggleMenu(false));
            });
            
            // Close menu when pressing Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                    toggleMenu(false);
                }
            });
        }
    }
    
    initializeTheme() {
        // Import the ThemeManager module
        import('../utils/theme.js').then(module => {
            // If themeManager doesn't exist yet, create it
            if (!window.themeManager) {
                window.themeManager = new module.ThemeManager();
            } else {
                // If themeManager already exists, reinitialize it
                window.themeManager.initialize();
            }
            
            // Dispatch an event to notify that theme has been initialized
            document.dispatchEvent(new CustomEvent('themeInitialized'));
        });
    }
}

// Initialize shared header when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.sharedHeader) {
        window.sharedHeader = new SharedHeader();
    }
});
