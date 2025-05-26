/**
 * WakeWell - Alarm Page Script
 * Handles alarm clock functionality
 */
import loadingManager from './utils/loading.js';
import toastManager from './utils/toast.js';
import { SmartAlarm } from './components/SmartAlarm.js';

class AlarmPage {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.loadAlarmSettings();
    }

    initializeElements() {
        // Time picker
        this.alarmTimeInput = document.getElementById('alarmTime');
        
        // Toggle switches
        this.smartWakeToggle = document.getElementById('smartWakeToggle');
        this.vibrationToggle = document.getElementById('vibrationToggle');
        
        // Sound options
        this.soundOptions = document.querySelectorAll('.sound-option');
        
        // Day options
        this.dayOptions = document.querySelectorAll('.day-option input');
    }

    initializeEventListeners() {
        // Time change
        this.alarmTimeInput.addEventListener('change', () => this.saveAlarmSettings());
        
        // Toggle switches
        this.smartWakeToggle.addEventListener('change', () => this.saveAlarmSettings());
        this.vibrationToggle.addEventListener('change', () => this.saveAlarmSettings());
        
        // Sound options
        this.soundOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                this.soundOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Save settings
                this.saveAlarmSettings();
                
                // Play sound preview
                this.playSound(option.dataset.sound);
            });
        });
        
        // Day options
        this.dayOptions.forEach(day => {
            day.addEventListener('change', () => this.saveAlarmSettings());
        });
    }

    loadAlarmSettings() {
        try {
            loadingManager.show();
            
            // Get saved settings from localStorage
            const settings = JSON.parse(localStorage.getItem('alarmSettings')) || {
                time: '06:30',
                smartWake: true,
                vibration: true,
                sound: 'gentle',
                days: ['mon', 'tue', 'wed', 'thu', 'fri']
            };
            
            // Apply settings to UI
            this.alarmTimeInput.value = settings.time;
            this.smartWakeToggle.checked = settings.smartWake;
            this.vibrationToggle.checked = settings.vibration;
            
            // Set selected sound
            this.soundOptions.forEach(option => {
                if (option.dataset.sound === settings.sound) {
                    option.classList.add('selected');
                }
            });
            
            // Set selected days
            this.dayOptions.forEach(day => {
                day.checked = settings.days.includes(day.value);
            });
            
            toastManager.success('Alarm settings loaded');
        } catch (error) {
            console.error('Error loading alarm settings:', error);
            toastManager.error('Failed to load alarm settings');
        } finally {
            loadingManager.hide();
        }
    }

    saveAlarmSettings() {
        try {
            // Build settings object
            const settings = {
                time: this.alarmTimeInput.value,
                smartWake: this.smartWakeToggle.checked,
                vibration: this.vibrationToggle.checked,
                sound: Array.from(this.soundOptions).find(opt => opt.classList.contains('selected'))?.dataset.sound || 'gentle',
                days: Array.from(this.dayOptions).filter(day => day.checked).map(day => day.value)
            };
            
            // Save to localStorage
            localStorage.setItem('alarmSettings', JSON.stringify(settings));
            
            toastManager.success('Alarm settings saved');
        } catch (error) {
            console.error('Error saving alarm settings:', error);
            toastManager.error('Failed to save alarm settings');
        }
    }

    playSound(sound) {
        // Simple sound preview
        const audioMap = {
            'gentle': 'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3',
            'nature': 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3',
            'bell': 'https://assets.mixkit.co/sfx/preview/mixkit-classic-alarm-995.mp3',
            'chime': 'https://assets.mixkit.co/sfx/preview/mixkit-cathedral-bells-ringing-602.mp3'
        };
        
        const audio = new Audio(audioMap[sound]);
        audio.volume = 0.5;
        audio.play();
    }
}

// Initialize alarm page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.alarmPage = new AlarmPage();
});

// Get DOM elements
const elements = {
    timeInput: document.getElementById('alarmTime'),
    smartWakeToggle: document.getElementById('smartWakeToggle'),
    setAlarmBtn: document.getElementById('setAlarmBtn'),
    alarmStatus: document.getElementById('alarmStatus'),
    countdownDisplay: document.getElementById('countdownDisplay'),
    cancelAlarmBtn: document.getElementById('cancelAlarmBtn')
};

// Initialize SmartAlarm with SleepTracker instance
const smartAlarm = new SmartAlarm(window.sleepTracker);

// Update countdown timer
function updateCountdown() {
    if (!smartAlarm.alarmTime) return;

    const now = new Date();
    const timeUntilAlarm = smartAlarm.alarmTime - now;
    
    if (timeUntilAlarm <= 0) {
        elements.countdownDisplay.textContent = 'Alarm time reached';
        return;
    }

    // Calculate hours, minutes and seconds
    const hours = Math.floor(timeUntilAlarm / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilAlarm % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeUntilAlarm % (1000 * 60)) / 1000);

    // If in smart wake window, show special message
    if (smartAlarm.windowStart && now >= smartAlarm.windowStart) {
        elements.countdownDisplay.textContent = `Monitoring for ideal wake time (within ${minutes}m ${seconds}s)`;
        elements.countdownDisplay.classList.add('monitoring');
    } else {
        elements.countdownDisplay.textContent = `Alarm in ${hours}h ${minutes}m ${seconds}s`;
        elements.countdownDisplay.classList.remove('monitoring');
    }
}

// Set up alarm
elements.setAlarmBtn.addEventListener('click', () => {
    const time = elements.timeInput.value;
    const isSmartWake = elements.smartWakeToggle.checked;

    if (!time) {
        toastManager.error('Please select an alarm time');
        return;
    }

    loadingManager.show();

    try {
        const alarmInfo = smartAlarm.setAlarm(time, isSmartWake);
        
        // Update UI
        elements.alarmStatus.textContent = `Alarm set for ${time}${isSmartWake ? ' (Smart Wake enabled)' : ''}`;
        elements.setAlarmBtn.disabled = true;
        elements.cancelAlarmBtn.disabled = false;
        
        // Start countdown updates
        setInterval(updateCountdown, 1000);
        
        toastManager.success('Alarm set successfully');
        
        // If it's a smart alarm and sleep tracking isn't active, suggest starting it
        if (isSmartWake && !window.sleepTracker?.isTracking) {
            toastManager.info('Consider starting sleep tracking for better wake-up timing');
        }
    } catch (error) {
        console.error('Error setting alarm:', error);
        toastManager.error('Failed to set alarm');
    } finally {
        loadingManager.hide();
    }
});

// Cancel alarm
elements.cancelAlarmBtn.addEventListener('click', () => {
    smartAlarm.stopMonitoring();
    elements.setAlarmBtn.disabled = false;
    elements.cancelAlarmBtn.disabled = true;
    elements.alarmStatus.textContent = 'No alarm set';
    elements.countdownDisplay.textContent = '';
    elements.countdownDisplay.classList.remove('monitoring');
    toastManager.info('Alarm cancelled');
});

// Event listeners for alarm events
window.addEventListener('alarmMonitoringStarted', (event) => {
    const { windowStart } = event.detail;
    toastManager.info(`Smart wake monitoring will begin at ${windowStart.toLocaleTimeString()}`);
});

window.addEventListener('alarmTriggered', (event) => {
    const { reason } = event.detail;
    elements.alarmStatus.textContent = `Alarm triggered: ${reason}`;
});

window.addEventListener('alarmSnoozed', (event) => {
    const { snoozeCount, nextAlarm } = event.detail;
    elements.alarmStatus.textContent = `Alarm snoozed (${snoozeCount}/3) - Next: ${nextAlarm.toLocaleTimeString()}`;
});

window.addEventListener('alarmStopped', () => {
    elements.setAlarmBtn.disabled = false;
    elements.cancelAlarmBtn.disabled = true;
    elements.alarmStatus.textContent = 'No alarm set';
    elements.countdownDisplay.textContent = '';
    elements.countdownDisplay.classList.remove('monitoring');
});