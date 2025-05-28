// Shared Header Component
export class SharedHeader {
    constructor() {
        this.sidebarElement = document.querySelector('.sidebar');
        if (!this.sidebarElement) {
            this.createSidebar();
        }
        this.initializeTheme();
    }

    createSidebar() {
        // Get current theme for initial icon
        const currentTheme = localStorage.getItem('theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const themeIcon = currentTheme === 'dark' ? '🌙' : '☀️';
        
        // Create mobile header
        const mobileHeader = document.createElement('header');
        mobileHeader.className = 'mobile-header';
        mobileHeader.innerHTML = `
            <button id="menuToggle" class="menu-toggle" aria-label="Toggle menu">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <div class="sidebar-brand">WakeWell</div>
            <button id="themeToggle" class="theme-toggle" aria-label="Toggle light/dark theme">
                <span class="theme-icon">${themeIcon}</span>
            </button>
        `;
        
        // Create sidebar
        const sidebar = document.createElement('aside');
        sidebar.className = 'sidebar';
        
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <div class="sidebar-brand">WakeWell</div>
                <button class="sidebar-close" aria-label="Close menu">×</button>
            </div>
            <nav class="sidebar-nav">
                <a href="/" class="sidebar-nav-item ${window.location.pathname === '/' || window.location.pathname.endsWith('index.html') ? 'active' : ''}">
                    <span class="sidebar-icon">🏠</span>
                    <span>Home</span>
                </a>
                <a href="/pages/alarm.html" class="sidebar-nav-item ${window.location.pathname.includes('alarm.html') ? 'active' : ''}">
                    <span class="sidebar-icon">⏰</span>
                    <span>Alarm</span>
                </a>
                <a href="/pages/tracking.html" class="sidebar-nav-item ${window.location.pathname.includes('tracking.html') ? 'active' : ''}">
                    <span class="sidebar-icon">😴</span>
                    <span>Sleep</span>
                </a>
                <a href="/pages/reports.html" class="sidebar-nav-item ${window.location.pathname.includes('reports.html') ? 'active' : ''}">
                    <span class="sidebar-icon">📊</span>
                    <span>Reports</span>
                </a>
                <a href="/pages/settings.html" class="sidebar-nav-item ${window.location.pathname.includes('settings.html') ? 'active' : ''}">
                    <span class="sidebar-icon">⚙️</span>
                    <span>Settings</span>
                </a>
            </nav>
            <div class="sidebar-footer">
                <button id="themeToggleSidebar" class="theme-toggle" aria-label="Toggle light/dark theme">
                    <span class="theme-icon">${themeIcon}</span>
                    <span>Toggle Theme</span>
                </button>
            </div>
        `;
        
        // Insert elements into the DOM
        document.body.insertBefore(mobileHeader, document.body.firstChild);
        document.body.insertBefore(sidebar, document.body.firstChild);
        
        // Initialize mobile menu
        this.initMobileMenu();
    }
    
    initMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.sidebar');
        const closeButton = document.querySelector('.sidebar-close');
        
        if (menuToggle && sidebar && closeButton) {
            // Toggle menu function
            const toggleMenu = (open = null) => {
                const shouldOpen = open !== null ? open : !sidebar.classList.contains('active');
                
                if (shouldOpen) {
                    sidebar.classList.add('active');
                    document.body.style.overflow = 'hidden';
                } else {
                    sidebar.classList.remove('active');
                    document.body.style.overflow = '';
                }
            };
            
            // Toggle menu on button click
            menuToggle.addEventListener('click', () => toggleMenu());
            
            // Close menu when clicking close button
            closeButton.addEventListener('click', () => toggleMenu(false));
            
            // Close menu when clicking on a link
            sidebar.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => toggleMenu(false));
            });
            
            // Close menu when pressing Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && sidebar.classList.contains('active')) {
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
