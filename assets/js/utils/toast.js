/**
 * Toast Notification Manager
 * Handles showing toast notifications
 */

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {number} duration - Duration to show the toast in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
    // Get or create toast container
    let container = document.getElementById('toastContainer');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add toast to container
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove toast after duration
    setTimeout(() => {
        toast.classList.remove('show');
        
        // Remove from DOM after animation
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Convenience methods
export function successToast(message, duration = 3000) {
    showToast(message, 'success', duration);
}

export function errorToast(message, duration = 3000) {
    showToast(message, 'error', duration);
}

export function warningToast(message, duration = 3000) {
    showToast(message, 'warning', duration);
}

export function infoToast(message, duration = 3000) {
    showToast(message, 'info', duration);
}

// Export default object for compatibility
export default {
    show: showToast,
    success: successToast,
    error: errorToast,
    warning: warningToast,
    info: infoToast
};
