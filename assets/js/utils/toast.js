/**
 * Toast Notification Manager
 * Handles creating and displaying toast notifications
 */
export class ToastManager {
    constructor() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.createContainer();
        }
        this.toasts = [];
        this.maxToasts = 3;
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.id = 'toastContainer';
        document.body.appendChild(this.container);
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of toast (success, error, warning, info)
     * @param {number} duration - How long to show the toast in ms
     */
    show(message, type = 'info', duration = 3000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        // Add to container
        this.container.appendChild(toast);
        this.toasts.push(toast);
        
        // Limit number of toasts
        this.enforceMaxToasts();
        
        // Show toast with animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Hide after duration
        setTimeout(() => {
            this.hide(toast);
        }, duration);
        
        return toast;
    }

    /**
     * Hide a specific toast
     * @param {HTMLElement} toast - The toast element to hide
     */
    hide(toast) {
        toast.classList.remove('show');
        
        setTimeout(() => {
            if (toast.parentNode === this.container) {
                this.container.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300); // Match transition duration
    }

    /**
     * Ensure we don't show too many toasts at once
     */
    enforceMaxToasts() {
        while (this.toasts.length > this.maxToasts) {
            this.hide(this.toasts[0]);
        }
    }

    /**
     * Show a success toast
     * @param {string} message - The message to display
     * @param {number} duration - How long to show the toast in ms
     */
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    /**
     * Show an error toast
     * @param {string} message - The message to display
     * @param {number} duration - How long to show the toast in ms
     */
    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    /**
     * Show a warning toast
     * @param {string} message - The message to display
     * @param {number} duration - How long to show the toast in ms
     */
    warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Hide all toasts
     */
    hideAll() {
        [...this.toasts].forEach(toast => this.hide(toast));
    }
}

// Initialize toast manager
const toastManager = new ToastManager();

// Export singleton instance
export default toastManager;
