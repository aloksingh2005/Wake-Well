// Toast notification system
class ToastManager {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.toastQueue = [];
        this.isShowing = false;
        this.defaultOptions = {
            duration: 3000,
            type: 'info'
        };
    }

    show(message, options = {}) {
        const toastOptions = { ...this.defaultOptions, ...options };
        const toast = this.createToast(message, toastOptions);
        this.toastQueue.push({ element: toast, options: toastOptions });
        this.processQueue();
    }

    createToast(message, options) {
        const toast = document.createElement('div');
        toast.className = `toast ${options.type}`;
        toast.textContent = message;
        return toast;
    }

    processQueue() {
        if (this.toastQueue.length === 0 || this.isShowing) {
            return;
        }

        this.isShowing = true;
        const { element, options } = this.toastQueue.shift();
        
        // Add to DOM
        this.container.appendChild(element);
        
        // Trigger reflow
        void element.offsetWidth;
        
        // Show toast
        element.classList.add('show');
        
        // Auto-dismiss after duration
        setTimeout(() => {
            this.hideToast(element);
        }, options.duration);
    }

    hideToast(toast) {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode === this.container) {
                this.container.removeChild(toast);
            }
            this.isShowing = false;
            this.processQueue();
        }, { once: true });
    }
}

// Create a singleton instance
export const toastManager = new ToastManager();

// Helper functions for different toast types
export const toast = {
    success: (message, duration = 3000) => {
        toastManager.show(message, { type: 'success', duration });
    },
    error: (message, duration = 3000) => {
        toastManager.show(message, { type: 'error', duration });
    },
    warning: (message, duration = 3000) => {
        toastManager.show(message, { type: 'warning', duration });
    },
    info: (message, duration = 3000) => {
        toastManager.show(message, { type: 'info', duration });
    }
};
