/**
 * Loading Overlay Manager
 * Handles showing and hiding the loading overlay
 */

/**
 * Show loading overlay with optional message
 * @param {string} message - Optional message to display
 */
export function showLoading(message = null) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    
    // Add message if provided
    if (message) {
        let messageElement = overlay.querySelector('.loading-message');
        
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.className = 'loading-message';
            overlay.appendChild(messageElement);
        }
        
        messageElement.textContent = message;
    }
    
    // Show overlay
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Remove any message after transition
    setTimeout(() => {
        const messageElement = overlay.querySelector('.loading-message');
        if (messageElement) {
            messageElement.remove();
        }
    }, 300);
}

// Export default object for compatibility
export default {
    show: showLoading,
    hide: hideLoading
};
