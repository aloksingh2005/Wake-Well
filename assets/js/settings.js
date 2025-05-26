// Settings Page JavaScript

// DOM Elements
const elements = {
    // Profile Settings
    name: document.getElementById('name'),
    age: document.getElementById('age'),
    weight: document.getElementById('weight'),
    
    // Sleep Goals
    targetSleep: document.getElementById('targetSleep'),
    bedtime: document.getElementById('bedtime'),
    wakeup: document.getElementById('wakeup'),
    
    // Notification Settings
    bedtimeReminder: document.getElementById('bedtimeReminder'),
    sleepReport: document.getElementById('sleepReport'),
    goalReminder: document.getElementById('goalReminder'),
    
    // Sound Settings
    alarmVolume: document.getElementById('alarmVolume'),
    snoozeDuration: document.getElementById('snoozeDuration'),
    
    // Action Buttons
    exportData: document.getElementById('exportData'),
    clearData: document.getElementById('clearData')
};

// Load Settings
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    
    // Profile Settings
    elements.name.value = settings.name || '';
    elements.age.value = settings.age || '';
    elements.weight.value = settings.weight || '';
    
    // Sleep Goals
    elements.targetSleep.value = settings.targetSleep || 8;
    elements.bedtime.value = settings.bedtime || '22:00';
    elements.wakeup.value = settings.wakeup || '06:00';
    
    // Notification Settings
    elements.bedtimeReminder.checked = settings.bedtimeReminder ?? true;
    elements.sleepReport.checked = settings.sleepReport ?? true;
    elements.goalReminder.checked = settings.goalReminder ?? true;
    
    // Sound Settings
    elements.alarmVolume.value = settings.alarmVolume || 80;
    elements.snoozeDuration.value = settings.snoozeDuration || '10';
}

// Save Settings
function saveSettings() {
    const settings = {
        // Profile Settings
        name: elements.name.value,
        age: elements.age.value,
        weight: elements.weight.value,
        
        // Sleep Goals
        targetSleep: elements.targetSleep.value,
        bedtime: elements.bedtime.value,
        wakeup: elements.wakeup.value,
        
        // Notification Settings
        bedtimeReminder: elements.bedtimeReminder.checked,
        sleepReport: elements.sleepReport.checked,
        goalReminder: elements.goalReminder.checked,
        
        // Sound Settings
        alarmVolume: elements.alarmVolume.value,
        snoozeDuration: elements.snoozeDuration.value
    };
    
    localStorage.setItem('userSettings', JSON.stringify(settings));
    showSaveConfirmation();
}

// Show Save Confirmation
function showSaveConfirmation() {
    const confirmation = document.createElement('div');
    confirmation.className = 'save-confirmation';
    confirmation.textContent = 'Settings saved successfully!';
    
    document.body.appendChild(confirmation);
    
    setTimeout(() => {
        confirmation.remove();
    }, 2000);
}

// Export All Data
function exportAllData() {
    const data = {
        settings: JSON.parse(localStorage.getItem('userSettings') || '{}'),
        sleepData: JSON.parse(localStorage.getItem('sleepData') || '[]'),
        alarms: JSON.parse(localStorage.getItem('alarms') || '[]')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wakewell_data.json';
    link.click();
    URL.revokeObjectURL(url);
}

// Clear All Data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        localStorage.clear();
        loadSettings();
        showClearConfirmation();
    }
}

// Show Clear Confirmation
function showClearConfirmation() {
    const confirmation = document.createElement('div');
    confirmation.className = 'clear-confirmation';
    confirmation.textContent = 'All data has been cleared';
    
    document.body.appendChild(confirmation);
    
    setTimeout(() => {
        confirmation.remove();
    }, 2000);
}

// Validate Inputs
function validateInputs() {
    const age = parseInt(elements.age.value);
    const weight = parseFloat(elements.weight.value);
    const targetSleep = parseFloat(elements.targetSleep.value);
    
    if (age && (age < 1 || age > 120)) {
        alert('Please enter a valid age between 1 and 120');
        return false;
    }
    
    if (weight && (weight < 1 || weight > 300)) {
        alert('Please enter a valid weight between 1 and 300 kg');
        return false;
    }
    
    if (targetSleep && (targetSleep < 4 || targetSleep > 12)) {
        alert('Please enter a valid target sleep duration between 4 and 12 hours');
        return false;
    }
    
    return true;
}

// Event Listeners
Object.values(elements).forEach(element => {
    if (element && element.tagName === 'INPUT') {
        element.addEventListener('change', () => {
            if (validateInputs()) {
                saveSettings();
            }
        });
    }
});

elements.exportData.addEventListener('click', exportAllData);
elements.clearData.addEventListener('click', clearAllData);

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);

// Add CSS for confirmations
const style = document.createElement('style');
style.textContent = `
    .save-confirmation,
    .clear-confirmation {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 5px;
        color: white;
        font-size: 14px;
        animation: fadeInOut 2s ease-in-out;
    }
    
    .save-confirmation {
        background-color: var(--primary-color);
    }
    
    .clear-confirmation {
        background-color: var(--danger-color);
    }
    
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(20px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
`;
document.head.appendChild(style); 