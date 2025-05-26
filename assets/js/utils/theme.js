/**
 * Theme Manager for WakeWell
 * Handles theme switching between light and dark modes
 */

// Apply theme immediately on script load to prevent flash
(function() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme immediately
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
})();

export class ThemeManager {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Get saved theme or use system preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Set initial theme
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            this.setTheme(prefersDark ? 'dark' : 'light');
        }
        
        // Set up theme toggle button
        this.setupThemeToggle();
        
        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    setTheme(theme) {
        // Set data-theme attribute on document
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.updateThemeIcon('🌙');
        } else {
            document.documentElement.removeAttribute('data-theme');
            this.updateThemeIcon('☀️');
        }
        
        // Save theme preference
        localStorage.setItem('theme', theme);
    }

    updateThemeIcon(icon) {
        // Update all theme toggle icons
        const themeIcons = document.querySelectorAll('.theme-icon');
        themeIcons.forEach(iconElement => {
            iconElement.textContent = icon;
        });
    }

    toggleTheme() {
        const currentTheme = localStorage.getItem('theme') || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setupThemeToggle() {
        // Add click event to all theme toggle buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('#themeToggle') || e.target.closest('#themeToggleMobile')) {
                this.toggleTheme();
            }
        });
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.themeManager) {
        window.themeManager = new ThemeManager();
    }
});
