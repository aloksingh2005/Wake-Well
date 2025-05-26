/**
 * WakeWell - Main Application Script
 * Handles common functionality across all pages
 */
import loadingManager from './utils/loading.js';
import toastManager from './utils/toast.js';
import { notificationManager } from './notifications.js';
import { SleepHistory } from './components/SleepHistory.js';
import { ThemeManager } from './utils/theme.js';
import { SleepTracker } from './components/SleepTracker.js';
import { showToast } from './utils/toast.js';
import { showLoading, hideLoading } from './utils/loading.js';
import { SleepStreak } from './components/SleepStreak.js';

// App State Management
const AppState = {
    sleepData: {
        startTime: null,
        endTime: null,
        quality: 0,
        disturbances: 0,
        score: 0
    },
    alarmSettings: {
        time: '06:30',
        smartWake: true,
        sound: 'gentle',
        vibration: true
    },
    isTracking: false,
    notifications: {
        enabled: false,
        sound: true,
        vibration: true
    },
    sleepPhase: null,
    currentSession: null
};

// DOM Elements
const elements = {
    startSleepBtn: document.getElementById('startSleepBtn'),
    sleepScore: document.querySelector('.score'),
    alarmTime: document.querySelector('.alarm-time'),
    alarmStatus: document.querySelector('.alarm-status'),
    menuToggle: document.getElementById('menuToggle'),
    navLinks: document.querySelector('.nav-links')
};

// Theme Management - Using ThemeManager from theme.js
const themeManager = new ThemeManager();

// Mobile Menu Management
class MobileMenuManager {
    constructor() {
        this.isOpen = false;
        this.addEventListeners();
    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
        elements.navLinks.classList.toggle('active', this.isOpen);
        this.updateMenuIcon();
    }

    updateMenuIcon() {
        elements.menuToggle.classList.toggle('active', this.isOpen);
    }

    addEventListeners() {
        elements.menuToggle.addEventListener('click', () => this.toggleMenu());
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-links') && 
                !e.target.closest('.menu-toggle') && 
                this.isOpen) {
                this.toggleMenu();
            }
        });

        // Close menu when clicking a link
        elements.navLinks.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                this.toggleMenu();
            }
        });
    }
}

// Initialize sleep tracker
const sleepTracker = new SleepTracker();

// Sleep phase change listener
window.addEventListener('sleepPhaseChange', (event) => {
    const { phase, timestamp, duration } = event.detail;
    AppState.sleepPhase = phase;
    
    // Update UI based on sleep phase
    updateSleepPhaseUI(phase, duration);
});

function updateSleepPhaseUI(phase, duration) {
    const phaseText = document.querySelector('.sleep-phase');
    if (!phaseText) return;

    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    let phaseMessage = '';
    switch(phase) {
        case 'deep':
            phaseMessage = '😴 Deep Sleep';
            break;
        case 'light':
            phaseMessage = '💤 Light Sleep';
            break;
        case 'disturbed':
            phaseMessage = '⚠️ Disturbed Sleep';
            break;
    }

    phaseText.textContent = `${phaseMessage} | ${hours}h ${minutes}m`;
}

// Sleep Tracking Functions
class SleepTracker {
    constructor() {
        this.motionData = [];
        this.soundData = [];
        this.isTracking = false;
    }

    async startTracking() {
        try {
            loadingManager.show();
            // Request necessary permissions
            await this.requestPermissions();
            
            this.isTracking = true;
            AppState.isTracking = true;
            
            // Start collecting data
            this.startMotionTracking();
            this.startSoundTracking();
            
            // Update UI
            elements.startSleepBtn.textContent = 'Stop Tracking';
            elements.startSleepBtn.classList.add('tracking');
            
            // Store start time
            AppState.sleepData.startTime = new Date();
            
            toastManager.success('Sleep tracking started successfully!');
            
        } catch (error) {
            console.error('Error starting sleep tracking:', error);
            toastManager.error('Failed to start sleep tracking. ' + (error.message || 'Please check permissions.'));
        } finally {
            loadingManager.hide();
        }
    }

    async stopTracking() {
        try {
            loadingManager.show();
            this.isTracking = false;
            AppState.isTracking = false;
            
            // Stop data collection
            this.stopMotionTracking();
            this.stopSoundTracking();
            
            // Update UI
            elements.startSleepBtn.textContent = 'Start Sleep Tracking';
            elements.startSleepBtn.classList.remove('tracking');
            
            // Store end time and calculate sleep data
            AppState.sleepData.endTime = new Date();
            await this.calculateSleepScore();
            
            // Update sleep history when tracking stops
            updateSleepHistory();
            
            toastManager.success('Sleep tracking stopped. Your sleep data has been saved.');
        } catch (error) {
            console.error('Error stopping sleep tracking:', error);
            toastManager.error('Error saving sleep data: ' + (error.message || 'Please try again.'));
        } finally {
            loadingManager.hide();
        }
    }

    async requestPermissions() {
        // Request motion permission
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            await DeviceMotionEvent.requestPermission();
        }
        
        // Request audio permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
    }

    startMotionTracking() {
        window.addEventListener('devicemotion', this.handleMotion);
    }

    stopMotionTracking() {
        window.removeEventListener('devicemotion', this.handleMotion);
    }

    handleMotion(event) {
        if (!this.isTracking) return;
        
        const { x, y, z } = event.acceleration;
        this.motionData.push({
            timestamp: Date.now(),
            x, y, z
        });
    }

    startSoundTracking() {
        // Initialize audio context and analyzer
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        
        // Get microphone stream
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const source = this.audioContext.createMediaStreamSource(stream);
                source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                // Start analyzing
                this.analyzeSound();
            })
            .catch(error => console.error('Error accessing microphone:', error));
    }

    stopSoundTracking() {
        if (this.audioContext) {
            this.audioContext.close();
        }
    }

    analyzeSound() {
        if (!this.isTracking) return;
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        this.soundData.push({
            timestamp: Date.now(),
            volume: average
        });
        
        // Continue analyzing
        requestAnimationFrame(() => this.analyzeSound());
    }

    async calculateSleepScore() {
        try {
            loadingManager.show();
            
            // Calculate sleep duration
            const duration = (AppState.sleepData.endTime - AppState.sleepData.startTime) / (1000 * 60 * 60);
            
            // Analyze motion data for disturbances
            const disturbances = this.analyzeDisturbances();
            
            // Calculate quality based on disturbances and duration
            const quality = this.calculateQuality(duration, disturbances);
            
            // Update app state
            AppState.sleepData.quality = quality;
            AppState.sleepData.disturbances = disturbances;
            AppState.sleepData.score = Math.round(quality * 100);
            
            // Save to history
            sleepHistory.addEntry({
                ...AppState.sleepData,
                duration: AppState.sleepData.endTime - AppState.sleepData.startTime
            });
            
            // Update UI
            this.updateUI();
            
            // Show success message
            toastManager.success('Sleep data saved successfully!');
            
            return AppState.sleepData;
        } catch (error) {
            console.error('Error calculating sleep score:', error);
            toastManager.error('Failed to calculate sleep score');
            throw error;
        } finally {
            loadingManager.hide();
        }
    }

    analyzeDisturbances() {
        // Simple disturbance detection based on motion
        return this.motionData.filter(data => 
            Math.abs(data.x) > 1 || Math.abs(data.y) > 1 || Math.abs(data.z) > 1
        ).length;
    }

    calculateQuality(duration, disturbances) {
        // Basic quality calculation
        const baseQuality = Math.min(duration / 8, 1); // 8 hours is optimal
        const disturbanceFactor = Math.max(1 - (disturbances * 0.1), 0);
        
        return baseQuality * disturbanceFactor;
    }

    updateUI() {
        elements.sleepScore.textContent = AppState.sleepData.score;
    }
}

// Enhanced Alarm Manager
class AlarmManager {
    constructor() {
        this.alarmTimeout = null;
        this.audioContext = null;
        this.snoozeCount = 0;
        this.maxSnoozes = 3;
        this.bind();
    }

    setAlarm(time, smartWake = true) {
        // Clear existing alarm
        if (this.alarmTimeout) {
            clearTimeout(this.alarmTimeout);
        }

        // Parse time
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const alarmTime = new Date(now);
        alarmTime.setHours(hours, minutes, 0, 0);

        // If alarm time has passed, set for next day
        if (alarmTime <= now) {
            alarmTime.setDate(alarmTime.getDate() + 1);
        }

        // Calculate time until alarm
        const timeUntilAlarm = alarmTime - now;

        // Set alarm
        this.alarmTimeout = setTimeout(() => {
            this.triggerAlarm(smartWake);
        }, timeUntilAlarm);

        // Update UI
        elements.alarmTime.textContent = time;
        elements.alarmStatus.textContent = `Smart Wake: ${smartWake ? 'ON' : 'OFF'}`;
    }

    triggerAlarm(smartWake) {
        if (smartWake) {
            // Check sleep phase and adjust alarm
            this.checkSleepPhase();
        } else {
            // Trigger alarm immediately
            this.playAlarm();
        }
    }

    checkSleepPhase() {
        // Get recent motion data
        const recentMotion = sleepTracker.motionData.slice(-30);
        
        // If minimal movement, likely in deep sleep
        const isDeepSleep = recentMotion.every(data => 
            Math.abs(data.x) < 0.5 && Math.abs(data.y) < 0.5 && Math.abs(data.z) < 0.5
        );

        if (isDeepSleep) {
            // Wait for light sleep phase
            setTimeout(() => this.playAlarm(), 20 * 60 * 1000); // 20 minutes
        } else {
            // Already in light sleep, trigger alarm
            this.playAlarm();
        }
    }

    async playAlarm() {
        try {
            // Show notification
            if (AppState.notifications.enabled) {
                await notificationManager.showNotification('Time to Wake Up!', {
                    body: 'Your WakeWell alarm is going off',
                    data: {
                        alarmTime: new Date().toLocaleTimeString()
                    }
                });
            }

            // Play sound if enabled
            if (AppState.notifications.sound) {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }

                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // Enhanced wake-up sound
                this.createPleasantWakeupSound(oscillator, gainNode);
            }

            // Vibrate if enabled
            if (AppState.notifications.vibration && navigator.vibrate) {
                this.createVibrationPattern();
            }
            
            this.showAlarmUI();
        } catch (error) {
            console.error('Error playing alarm:', error);
            alert('Could not play alarm sound. Please check your device settings.');
        }
    }

    createPleasantWakeupSound(oscillator, gainNode) {
        // Start with a gentle sine wave
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(294, this.audioContext.currentTime); // D4 note

        // Gradually increase volume
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 3);

        // Create a pleasant melody
        this.scheduleNote(oscillator, 294, 0); // D4
        this.scheduleNote(oscillator, 330, 1); // E4
        this.scheduleNote(oscillator, 349, 2); // F4
        this.scheduleNote(oscillator, 392, 3); // G4
        this.scheduleNote(oscillator, 440, 4); // A4

        oscillator.start();
    }

    scheduleNote(oscillator, frequency, delay) {
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime + delay);
    }

    createVibrationPattern() {
        // Create a gentle escalating vibration pattern
        const pattern = [];
        for (let i = 0; i < 5; i++) {
            pattern.push(200 + i * 100); // Vibration duration
            pattern.push(100 + i * 50);  // Pause duration
        }
        navigator.vibrate(pattern);
    }

    snoozeAlarm(overlay, oscillator, gainNode) {
        if (this.snoozeCount >= this.maxSnoozes) {
            alert('Maximum snooze count reached. Time to wake up!');
            return;
        }

        this.snoozeCount++;
        this.stopAlarm(overlay, oscillator, gainNode);
        
        // Set new alarm for 5 minutes later
        const now = new Date();
        const snoozeTime = new Date(now.getTime() + 5 * 60000);
        const timeString = `${String(snoozeTime.getHours()).padStart(2, '0')}:${String(snoozeTime.getMinutes()).padStart(2, '0')}`;
        
        // Update UI to show snooze count
        elements.alarmStatus.textContent = `Snoozed (${this.maxSnoozes - this.snoozeCount} remaining)`;
        
        this.setAlarm(timeString, false);
    }

    stopAlarm(overlay, oscillator, gainNode) {
        // Reset snooze count
        this.snoozeCount = 0;
        
        // Fade out audio
        if (gainNode) {
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
            setTimeout(() => {
                oscillator.stop();
                overlay.remove();
            }, 500);
        } else {
            overlay.remove();
        }

        // Stop vibration
        if (navigator.vibrate) {
            navigator.vibrate(0);
        }

        // Update UI
        elements.alarmStatus.textContent = `Smart Wake: ${AppState.alarmSettings.smartWake ? 'ON' : 'OFF'}`;
    }

    bind() {
        // Bind context to class methods
        this.setAlarm = this.setAlarm.bind(this);
        this.triggerAlarm = this.triggerAlarm.bind(this);
        this.checkSleepPhase = this.checkSleepPhase.bind(this);
        this.playAlarm = this.playAlarm.bind(this);
        this.createPleasantWakeupSound = this.createPleasantWakeupSound.bind(this);
        this.scheduleNote = this.scheduleNote.bind(this);
        this.createVibrationPattern = this.createVibrationPattern.bind(this);
        this.snoozeAlarm = this.snoozeAlarm.bind(this);
        this.stopAlarm = this.stopAlarm.bind(this);
    }
}

// App class to manage overall application logic
class App {
    constructor() {
        this.sleepTracker = new SleepTracker();
        this.alarmManager = new AlarmManager();
        this.sleepHistory = new SleepHistory();
        this.sleepStreak = new SleepStreak();
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            // Show loading overlay during initialization
            loadingManager.show();
            
            // Initialize components
            await this.initializeComponents();
            
            // Register service worker for PWA functionality
            this.registerServiceWorker();
            
            // Hide loading overlay when done
            loadingManager.hide();
            
            // Show welcome message
            this.showWelcomeMessage();
        } catch (error) {
            console.error('Error initializing app:', error);
            toastManager.error('Failed to initialize app. Please refresh the page.');
            loadingManager.hide();
        }
    }

    async initializeComponents() {
        // Initialize any common components here
        return new Promise(resolve => {
            // Simulate component initialization
            setTimeout(resolve, 500);
        });
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed: ', error);
                    });
            });
        }
    }

    showWelcomeMessage() {
        // Only show welcome message on first visit or after updates
        const lastVisit = localStorage.getItem('lastVisit');
        const now = new Date().toISOString();
        
        if (!lastVisit) {
            toastManager.success('Welcome to WakeWell!');
        }
        
        localStorage.setItem('lastVisit', now);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.wakeWellApp = new App();
});

// Export app for potential use in other modules
export default App;

// Make theme manager globally available
window.themeManager = themeManager;

// Update sleep history in the UI
function updateSleepHistory() {
    const container = document.getElementById('sleepHistoryContainer');
    if (container) {
        container.innerHTML = '';
        container.appendChild(sleepHistory.render());
    }
}

// Event Listeners
elements.startSleepBtn.addEventListener('click', async () => {
    try {
        if (!AppState.isTracking) {
            showLoading('Starting sleep tracking...');
            const result = await sleepTracker.startTracking();
            
            if (result.success) {
                AppState.isTracking = true;
                elements.startSleepBtn.textContent = 'Stop Tracking';
                elements.startSleepBtn.classList.add('tracking');
                showToast('Sleep tracking started', 'success');
            } else {
                showToast(result.message, 'error');
            }
        } else {
            showLoading('Processing sleep data...');
            const sleepData = await sleepTracker.stopTracking();
            
            AppState.isTracking = false;
            elements.startSleepBtn.textContent = 'Start Sleep Tracking';
            elements.startSleepBtn.classList.remove('tracking');
            
            // Update sleep score and stats
            updateSleepStats(sleepData);
            
            // Save sleep data
            saveSleepData(sleepData);
            
            showToast('Sleep tracking completed', 'success');
        }
    } catch (error) {
        console.error('Sleep tracking error:', error);
        showToast('Error with sleep tracking', 'error');
    } finally {
        hideLoading();
    }
});

function updateSleepStats(sleepData) {
    // Update sleep score
    elements.sleepScore.textContent = Math.round(sleepData.quality);
    
    // Update sleep duration
    const durationEl = document.querySelector('.stat .value');
    const hours = Math.floor(sleepData.duration);
    const minutes = Math.round((sleepData.duration - hours) * 60);
    durationEl.textContent = `${hours}h ${minutes}m`;
    
    // Update quality description with streak context
    const scoreDescription = document.querySelector('.score-description');
    const streakData = JSON.parse(localStorage.getItem('sleepStreak') || '{}');
    const currentStreak = streakData.currentStreak || 0;
    
    let message = '';
    if (sleepData.quality >= 90) {
        message = 'Excellent sleep quality!';
    } else if (sleepData.quality >= 70) {
        message = 'Good sleep last night!';
    } else if (sleepData.quality >= 50) {
        message = 'Fair sleep quality';
    } else {
        message = 'Poor sleep quality';
    }
    
    // Add streak context if there's a streak
    if (currentStreak > 1) {
        message += ` 🔥 ${currentStreak} day streak!`;
    }
    
    scoreDescription.textContent = message;
}

function saveSleepData(sleepData) {
    // Get existing sleep history
    const sleepHistory = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
    
    // Add new sleep data with date
    const sleepEntry = {
        date: new Date().toISOString(),
        ...sleepData
    };
    
    sleepHistory.push(sleepEntry);
    
    // Keep only last 30 days of data
    if (sleepHistory.length > 30) {
        sleepHistory.shift();
    }
    
    // Save updated history
    localStorage.setItem('sleepHistory', JSON.stringify(sleepHistory));
    
    // Trigger sleep history update
    document.dispatchEvent(new CustomEvent('sleepHistoryUpdated', {
        detail: { history: sleepHistory }
    }));
    
    // Trigger sleep data update for streak calculation
    document.dispatchEvent(new CustomEvent('sleepDataUpdated', {
        detail: { sleepData: sleepEntry }
    }));
}