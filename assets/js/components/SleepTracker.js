// Advanced Sleep Tracking System
export class SleepTracker {
    constructor() {
        this.isTracking = false;
        this.motionData = [];
        this.soundData = [];
        this.startTime = null;
        this.audioContext = null;
        this.analyser = null;
        this.mediaStream = null;
        
        // Configuration
        this.config = {
            motionThreshold: 1.5,    // Threshold for significant movement
            soundThreshold: 50,      // Threshold for noise detection (0-255)
            sampleInterval: 1000,    // Sample every 1 second
            deepSleepThreshold: 0.5  // Threshold for deep sleep detection
        };

        // Bind methods
        this.handleMotion = this.handleMotion.bind(this);
        this.analyzeSoundLevel = this.analyzeSoundLevel.bind(this);
        this.processSleepData = this.processSleepData.bind(this);
    }

    async startTracking() {
        try {
            await this.requestPermissions();
            this.isTracking = true;
            this.startTime = new Date();
            
            // Start motion tracking
            await this.startMotionTracking();
            
            // Start sound tracking
            await this.startSoundTracking();
            
            // Start periodic sleep phase analysis
            this.startSleepPhaseAnalysis();
            
            return { success: true, message: 'Sleep tracking started successfully' };
        } catch (error) {
            console.error('Failed to start sleep tracking:', error);
            return { 
                success: false, 
                message: 'Could not start sleep tracking. Please check permissions.',
                error: error.message 
            };
        }
    }

    async requestPermissions() {
        // Request motion permission on iOS
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            const motionPermission = await DeviceMotionEvent.requestPermission();
            if (motionPermission !== 'granted') {
                throw new Error('Motion permission denied');
            }
        }

        // Request audio permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        this.mediaStream = stream;
    }

    async startMotionTracking() {
        window.addEventListener('devicemotion', this.handleMotion);
    }

    async startSoundTracking() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        source.connect(this.analyser);
        
        // Start continuous sound analysis
        this.analyzeSoundLevel();
    }

    handleMotion(event) {
        if (!this.isTracking) return;

        const { x, y, z } = event.acceleration || event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
        
        // Calculate movement intensity
        const intensity = Math.sqrt(x*x + y*y + z*z);
        
        this.motionData.push({
            timestamp: Date.now(),
            intensity,
            raw: { x, y, z }
        });

        // Keep only last hour of data
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.motionData = this.motionData.filter(data => data.timestamp > oneHourAgo);
    }

    analyzeSoundLevel() {
        if (!this.isTracking || !this.analyser) return;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        // Calculate average volume level
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        this.soundData.push({
            timestamp: Date.now(),
            level: average
        });

        // Keep only last hour of data
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.soundData = this.soundData.filter(data => data.timestamp > oneHourAgo);

        // Continue analyzing
        requestAnimationFrame(this.analyzeSoundLevel);
    }

    startSleepPhaseAnalysis() {
        this.analysisInterval = setInterval(() => {
            const sleepPhase = this.detectSleepPhase();
            this.processSleepData(sleepPhase);
        }, this.config.sampleInterval);
    }

    detectSleepPhase() {
        // Get recent motion and sound data
        const recentMotion = this.getRecentMotionData(5 * 60 * 1000); // Last 5 minutes
        const recentSound = this.getRecentSoundData(5 * 60 * 1000);

        // Calculate average movement intensity
        const avgMotion = recentMotion.reduce((sum, data) => sum + data.intensity, 0) / recentMotion.length;
        
        // Calculate average sound level
        const avgSound = recentSound.reduce((sum, data) => sum + data.level, 0) / recentSound.length;

        // Determine sleep phase
        if (avgMotion < this.config.deepSleepThreshold && avgSound < this.config.soundThreshold) {
            return 'deep';
        } else if (avgMotion < this.config.motionThreshold) {
            return 'light';
        } else {
            return 'disturbed';
        }
    }

    getRecentMotionData(duration) {
        const startTime = Date.now() - duration;
        return this.motionData.filter(data => data.timestamp > startTime);
    }

    getRecentSoundData(duration) {
        const startTime = Date.now() - duration;
        return this.soundData.filter(data => data.timestamp > startTime);
    }

    processSleepData(currentPhase) {
        // Emit sleep phase change event
        const event = new CustomEvent('sleepPhaseChange', {
            detail: {
                phase: currentPhase,
                timestamp: Date.now(),
                duration: Date.now() - this.startTime
            }
        });
        window.dispatchEvent(event);
    }

    async stopTracking() {
        this.isTracking = false;
        
        // Stop motion tracking
        window.removeEventListener('devicemotion', this.handleMotion);
        
        // Stop sound tracking
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            await this.audioContext.close();
        }
        
        // Stop analysis interval
        clearInterval(this.analysisInterval);
        
        // Calculate final sleep data
        const sleepData = this.calculateSleepData();
        
        // Clear data arrays
        this.motionData = [];
        this.soundData = [];
        
        return sleepData;
    }

    calculateSleepData() {
        const endTime = Date.now();
        const duration = (endTime - this.startTime) / (1000 * 60 * 60); // in hours
        
        // Calculate disturbances
        const disturbances = this.motionData.filter(data => 
            data.intensity > this.config.motionThreshold
        ).length;
        
        // Calculate noise disruptions
        const noiseDisruptions = this.soundData.filter(data =>
            data.level > this.config.soundThreshold
        ).length;

        return {
            startTime: this.startTime,
            endTime: new Date(endTime),
            duration,
            disturbances,
            noiseDisruptions,
            quality: this.calculateSleepQuality(duration, disturbances, noiseDisruptions),
            motionData: this.motionData,
            soundData: this.soundData
        };
    }

    calculateSleepQuality(duration, disturbances, noiseDisruptions) {
        // Base score from duration (optimal is 7-9 hours)
        let durationScore = 0;
        if (duration >= 7 && duration <= 9) {
            durationScore = 100;
        } else if (duration >= 6 && duration < 7) {
            durationScore = 80;
        } else if (duration > 9 && duration <= 10) {
            durationScore = 90;
        } else {
            durationScore = 60;
        }

        // Penalty for disturbances
        const disturbancesPenalty = Math.min((disturbances * 2), 30);
        
        // Penalty for noise
        const noisePenalty = Math.min((noiseDisruptions * 1.5), 20);

        // Calculate final score
        const finalScore = Math.max(0, Math.min(100, 
            durationScore - disturbancesPenalty - noisePenalty
        ));

        return finalScore;
    }
}
