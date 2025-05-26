// Advanced Smart Alarm System
export class SmartAlarm {
    constructor(sleepTracker) {
        this.sleepTracker = sleepTracker;
        this.alarmTime = null;
        this.windowStart = null;
        this.monitoringInterval = null;
        this.isTriggered = false;
        this.audio = null;
        
        // Configuration
        this.config = {
            smartWindowDuration: 30 * 60 * 1000, // 30 minutes in ms
            checkInterval: 60 * 1000,            // Check every minute
            maxSnoozeCount: 3,
            soundFadeInDuration: 30,             // Fade in duration in seconds
            vibrationPattern: [200, 100, 200, 100, 400]
        };

        this.currentSnoozeCount = 0;
        
        // Bind methods
        this.monitorSleepPhase = this.monitorSleepPhase.bind(this);
        this.handleAlarmStop = this.handleAlarmStop.bind(this);
    }

    setAlarm(time, isSmartWake = true) {
        // Parse time string (HH:mm) into Date
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        this.alarmTime = new Date(now);
        this.alarmTime.setHours(hours, minutes, 0, 0);

        // If alarm time has passed today, set for tomorrow
        if (this.alarmTime <= now) {
            this.alarmTime.setDate(this.alarmTime.getDate() + 1);
        }

        // Calculate smart window start time (30 min before alarm)
        this.windowStart = new Date(this.alarmTime.getTime() - this.config.smartWindowDuration);
        
        // Reset state
        this.isTriggered = false;
        this.currentSnoozeCount = 0;

        // Start monitoring if smart wake is enabled
        if (isSmartWake) {
            this.startMonitoring();
        } else {
            // For regular alarm, just set timeout
            const timeUntilAlarm = this.alarmTime - now;
            setTimeout(() => this.triggerAlarm('Regular Wake-Up'), timeUntilAlarm);
        }

        return {
            alarmTime: this.alarmTime,
            windowStart: this.windowStart,
            isSmartWake
        };
    }

    startMonitoring() {
        // Clear any existing monitoring
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        // Start periodic monitoring
        this.monitoringInterval = setInterval(this.monitorSleepPhase, this.config.checkInterval);

        // Emit monitoring started event
        window.dispatchEvent(new CustomEvent('alarmMonitoringStarted', {
            detail: {
                alarmTime: this.alarmTime,
                windowStart: this.windowStart
            }
        }));
    }

    async monitorSleepPhase() {
        const now = new Date();

        // Check if we're in the smart wake window
        if (now >= this.windowStart && now <= this.alarmTime && !this.isTriggered) {
            const sleepPhase = this.sleepTracker.detectSleepPhase();
            const recentMotion = this.sleepTracker.getRecentMotionData(5 * 60 * 1000);
            const recentSound = this.sleepTracker.getRecentSoundData(5 * 60 * 1000);

            // Calculate average movement and sound
            const avgMotion = recentMotion.reduce((sum, data) => sum + data.intensity, 0) / recentMotion.length;
            const avgSound = recentSound.reduce((sum, data) => sum + data.level, 0) / recentSound.length;

            // Check for ideal wake conditions
            if (sleepPhase === 'light' && avgMotion < this.sleepTracker.config.motionThreshold) {
                await this.triggerAlarm('Smart Wake-Up (Light Sleep Phase)');
            }
        } 
        // Fallback alarm at exact time if not triggered
        else if (now >= this.alarmTime && !this.isTriggered) {
            await this.triggerAlarm('Regular Wake-Up (Fallback)');
        }
    }

    async triggerAlarm(reason) {
        this.isTriggered = true;
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('WakeWell', {
                body: `${reason} ⏰ Time to wake up!`,
                icon: '/assets/icons/icon-192x192.png',
                badge: '/assets/icons/badge-96x96.png',
                vibrate: this.config.vibrationPattern,
                requireInteraction: true,
                actions: [
                    { action: 'snooze', title: 'Snooze (5min)' },
                    { action: 'stop', title: 'Stop' }
                ]
            });
        }

        // Start gentle wake-up sequence
        await this.playWakeSequence();

        // Show alarm UI
        this.showAlarmUI(reason);

        // Emit alarm triggered event
        window.dispatchEvent(new CustomEvent('alarmTriggered', {
            detail: { reason, timestamp: new Date() }
        }));
    }

    async playWakeSequence() {
        // Initialize audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create oscillator and gain node
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Start with no volume
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        
        // Configure pleasant wake sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(294, audioContext.currentTime); // D4 note
        
        // Gentle volume fade in
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + this.config.soundFadeInDuration);
        
        // Start audio
        oscillator.start();
        this.audio = { oscillator, gainNode, audioContext };
        
        // Vibrate if supported
        if ('vibrate' in navigator) {
            navigator.vibrate(this.config.vibrationPattern);
        }
    }

    showAlarmUI(reason) {
        const overlay = document.createElement('div');
        overlay.className = 'alarm-overlay';
        overlay.innerHTML = `
            <div class="alarm-content">
                <h2>Time to Wake Up!</h2>
                <p class="alarm-reason">${reason}</p>
                <div class="alarm-actions">
                    ${this.currentSnoozeCount < this.config.maxSnoozeCount ? 
                        '<button id="snoozeAlarm" class="btn-secondary">Snooze (5min)</button>' : 
                        '<p class="snooze-limit">No more snoozes available</p>'}
                    <button id="stopAlarm" class="btn-primary">Stop Alarm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add event listeners
        const stopBtn = overlay.querySelector('#stopAlarm');
        const snoozeBtn = overlay.querySelector('#snoozeAlarm');
        
        stopBtn.addEventListener('click', () => this.handleAlarmStop(overlay));
        if (snoozeBtn) {
            snoozeBtn.addEventListener('click', () => this.handleSnooze(overlay));
        }
    }

    async handleAlarmStop(overlay) {
        // Stop audio
        if (this.audio) {
            const { oscillator, gainNode, audioContext } = this.audio;
            
            // Fade out
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
            setTimeout(() => {
                oscillator.stop();
                audioContext.close();
            }, 500);
            
            this.audio = null;
        }
        
        // Stop vibration
        if ('vibrate' in navigator) {
            navigator.vibrate(0);
        }
        
        // Remove UI
        overlay.remove();
        
        // Reset state
        this.currentSnoozeCount = 0;
        this.isTriggered = false;
        
        // Emit event
        window.dispatchEvent(new CustomEvent('alarmStopped'));
    }

    async handleSnooze(overlay) {
        if (this.currentSnoozeCount >= this.config.maxSnoozeCount) {
            return;
        }
        
        this.currentSnoozeCount++;
        
        // Stop current alarm
        await this.handleAlarmStop(overlay);
        
        // Calculate new alarm time (5 minutes from now)
        const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
        const timeString = `${String(snoozeTime.getHours()).padStart(2, '0')}:${String(snoozeTime.getMinutes()).padStart(2, '0')}`;
        
        // Set new alarm
        this.setAlarm(timeString, false);
        
        // Emit event
        window.dispatchEvent(new CustomEvent('alarmSnoozed', {
            detail: {
                snoozeCount: this.currentSnoozeCount,
                nextAlarm: snoozeTime
            }
        }));
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
}
