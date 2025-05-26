// Loading utility for showing/hiding loading overlay
class LoadingManager {
    constructor() {
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingCount = 0;
    }

    show() {
        this.loadingCount++;
        if (this.loadingCount === 1) {
            this.loadingOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hide() {
        if (this.loadingCount > 0) {
            this.loadingCount--;
        }
        
        if (this.loadingCount === 0) {
            this.loadingOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    reset() {
        this.loadingCount = 0;
        this.loadingOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Create a singleton instance
export const loadingManager = new LoadingManager();

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
