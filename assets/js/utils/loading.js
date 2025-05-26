/**
 * Loading Overlay Manager
 * Handles showing and hiding the loading overlay
 */
export class LoadingManager {
    constructor() {
        this.overlay = document.getElementById('loadingOverlay');
        if (!this.overlay) {
            this.createOverlay();
        }
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.id = 'loadingOverlay';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        this.overlay.appendChild(spinner);
        document.body.appendChild(this.overlay);
    }

    show() {
        if (this.overlay) {
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Shows loading overlay for a specified duration
     * @param {number} duration - Duration in milliseconds
     * @returns {Promise} - Resolves when loading is complete
     */
    showFor(duration) {
        return new Promise(resolve => {
            this.show();
            setTimeout(() => {
                this.hide();
                resolve();
            }, duration);
        });
    }

    /**
     * Shows loading overlay while a promise is resolving
     * @param {Promise} promise - The promise to wait for
     * @returns {Promise} - The original promise
     */
    async during(promise) {
        try {
            this.show();
            return await promise;
        } finally {
            this.hide();
        }
    }
}

// Initialize loading manager
const loadingManager = new LoadingManager();

// Export singleton instance
export default loadingManager;

// Helper function for async operations with loading state
export async function withLoading(asyncFunction) {
    loadingManager.show();
    try {
        const result = await asyncFunction();
        return result;
    } finally {
        loadingManager.hide();
    }
}
