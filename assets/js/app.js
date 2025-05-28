/**
 * WakeWell - Main Application
 * Initializes components and manages the main application flow
 */

// Import required modules
import { SleepHistory } from './components/SleepHistory.js';
import { showToast } from './utils/toast.js';
import { hideLoading } from './utils/loading.js';

// Main App Class
class App {
    constructor() {
        this.initializeComponents();
        this.setupEventListeners();
        this.loadUserData();
    }

    // Initialize all components
    initializeComponents() {
        // Initialize sleep history component
        this.sleepHistory = new SleepHistory();
        const sleepHistoryContainer = document.getElementById('sleepHistoryContainer');
        if (sleepHistoryContainer) {
            this.sleepHistory.render();
        }

        // Initialize streak days
        this.initializeStreakDays();
    }

    // Set up event listeners
    setupEventListeners() {
        // Start sleep tracking button
        const startSleepBtn = document.getElementById('startSleepBtn');
        if (startSleepBtn) {
            startSleepBtn.addEventListener('click', () => this.startSleepTracking());
        }

        // Theme change event
        document.addEventListener('themeChanged', () => {
            this.updateThemeBasedUI();
        });
    }

    // Load user data from storage
    loadUserData() {
        try {
            // Load user preferences
            const preferences = localStorage.getItem('wakewell_preferences');
            if (preferences) {
                this.preferences = JSON.parse(preferences);
            } else {
                this.preferences = {
                    notifications: true,
                    soundEnabled: true,
                    vibrationEnabled: true
                };
            }

            // Update UI based on loaded data
            this.updateUIFromData();
        } catch (error) {
            console.error('Error loading user data:', error);
            showToast('Error loading your data. Some features may not work correctly.', 'error');
        }

        // Hide loading overlay when done
        hideLoading();
    }

    // Update UI based on loaded data
    updateUIFromData() {
        // Update streak display
        this.updateStreakDisplay();
    }

    // Initialize streak days display
    initializeStreakDays() {
        const streakDaysContainer = document.getElementById('streakDays');
        if (!streakDaysContainer) return;

        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        const streakData = this.getStreakData();
        
        let streakHTML = '';
        days.forEach((day, index) => {
            const isCompleted = streakData.completedDays.includes(index);
            streakHTML += `
                <div class="streak-day ${isCompleted ? 'completed' : ''}">
                    <div class="day-label">${day}</div>
                    <div class="day-indicator"></div>
                </div>
            `;
        });
        
        streakDaysContainer.innerHTML = streakHTML;
    }

    // Get streak data from storage or mock data
    getStreakData() {
        // In a real app, this would come from storage
        // For now, return mock data
        return {
            currentStreak: 5,
            longestStreak: 14,
            completedDays: [0, 1, 2, 4, 6] // Monday, Tuesday, Wednesday, Friday, Sunday
        };
    }

    // Update streak display
    updateStreakDisplay() {
        const streakBadge = document.getElementById('streakBadge');
        if (!streakBadge) return;
        
        const streakData = this.getStreakData();
        const streakCount = document.querySelector('.streak-count');
        
        if (streakCount) {
            streakCount.textContent = streakData.currentStreak;
        }
    }

    // Start sleep tracking
    startSleepTracking() {
        // In a real app, this would start the tracking process
        // For demo purposes, show a toast and redirect
        showToast('Sleep tracking started!', 'success');
        
        // Redirect to tracking page in a real app
        // window.location.href = '/pages/tracking.html';
        
        // For demo, just change the button
        const startSleepBtn = document.getElementById('startSleepBtn');
        if (startSleepBtn) {
            startSleepBtn.textContent = 'Tracking Sleep...';
            startSleepBtn.classList.add('tracking');
            startSleepBtn.disabled = true;
            
            // Reset after 2 seconds for demo
            setTimeout(() => {
                startSleepBtn.textContent = 'Start Sleep Tracking';
                startSleepBtn.classList.remove('tracking');
                startSleepBtn.disabled = false;
            }, 2000);
        }
    }

    // Update UI elements based on theme
    updateThemeBasedUI() {
        // Any theme-specific UI updates can go here
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Show loading initially (will be hidden after data loads)
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }
    
    // Initialize app
    window.app = new App();
});