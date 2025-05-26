import { SmartAlarm } from './components/SmartAlarm.js';
import { showToast } from './utils/toast.js';
import { showLoading, hideLoading } from './utils/loading.js';

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
        showToast('Please select an alarm time', 'error');
        return;
    }

    showLoading('Setting up alarm...');

    try {
        const alarmInfo = smartAlarm.setAlarm(time, isSmartWake);
        
        // Update UI
        elements.alarmStatus.textContent = `Alarm set for ${time}${isSmartWake ? ' (Smart Wake enabled)' : ''}`;
        elements.setAlarmBtn.disabled = true;
        elements.cancelAlarmBtn.disabled = false;
        
        // Start countdown updates
        setInterval(updateCountdown, 1000);
        
        showToast('Alarm set successfully', 'success');
        
        // If it's a smart alarm and sleep tracking isn't active, suggest starting it
        if (isSmartWake && !window.sleepTracker?.isTracking) {
            showToast('Consider starting sleep tracking for better wake-up timing', 'info');
        }
    } catch (error) {
        console.error('Error setting alarm:', error);
        showToast('Failed to set alarm', 'error');
    } finally {
        hideLoading();
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
    showToast('Alarm cancelled', 'info');
});

// Event listeners for alarm events
window.addEventListener('alarmMonitoringStarted', (event) => {
    const { windowStart } = event.detail;
    showToast(`Smart wake monitoring will begin at ${windowStart.toLocaleTimeString()}`, 'info');
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