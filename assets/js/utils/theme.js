// Theme Manager Utility
export class ThemeManager {
    constructor() {
        // Get theme from localStorage or use system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        this.theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        this.themeToggle = null;
        this.themeIcon = null;
        
        // Apply theme immediately
        this.applyTheme();
        
        // Initialize after a short delay to ensure DOM is ready
        setTimeout(() => this.initialize(), 0);
    }

    initialize() {
        // Find all theme toggles (desktop and mobile)
        this.themeToggles = document.querySelectorAll('#themeToggle, #themeToggleMobile');
        this.themeIcons = document.querySelectorAll('.theme-icon');
        
        // If no toggle found in the current page, add one to the body
        if (this.themeToggles.length === 0) {
            this.addThemeToggleToBody();
        } else {
            this.addEventListeners();
            this.updateThemeIcon();
        }
    }
    
    addThemeToggleToBody() {
        const toggle = document.createElement('button');
        toggle.id = 'themeToggle';
        toggle.className = 'theme-toggle';
        toggle.setAttribute('aria-label', 'Toggle light/dark theme');
        toggle.innerHTML = '<span class="theme-icon">🌙</span>';
        
        // Add to a container or directly to body
        const container = document.querySelector('.theme-toggle-container') || document.body;
        container.appendChild(toggle);
        
        this.themeToggle = toggle;
        this.themeIcon = toggle.querySelector('.theme-icon');
    }

    applyTheme() {
        // Apply theme to html element
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Update meta theme color
        const themeColor = this.theme === 'dark' ? '#1a202c' : '#ffffff';
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
        this.updateThemeIcon();
        
        // Dispatch a theme changed event for other components to listen to
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: this.theme } 
        }));
    }

    updateThemeIcon() {
        this.themeIcons.forEach(icon => {
            if (icon) {
                icon.textContent = this.theme === 'dark' ? '🌙' : '☀️';
            }
        });
    }

    addEventListeners() {
        // Add click event to all theme toggles
        this.themeToggles.forEach(toggle => {
            if (toggle) {
                toggle.addEventListener('click', () => this.toggleTheme());
            }
        });
        
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener((e) => {
            // Only update if user hasn't explicitly set a preference
            if (!localStorage.getItem('theme')) {
                this.theme = e.matches ? 'dark' : 'light';
                this.applyTheme();
                this.updateThemeIcon();
            }
        });
    }
}

// Initialize theme manager on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!window.themeManager) {
        window.themeManager = new ThemeManager();
    } else {
        // Re-initialize in case elements were added dynamically
        window.themeManager.initialize();
    }
});

// Listen for theme initialization events from other components
document.addEventListener('themeInitialized', () => {
    if (window.themeManager) {
        window.themeManager.initialize();
    }
});
