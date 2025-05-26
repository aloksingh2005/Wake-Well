// Sleep Tracking JavaScript

// DOM Elements
const elements = {
    startTrackingBtn: document.getElementById('startTrackingBtn'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    timerStatus: document.getElementById('timerStatus'),
    sleepPhase: document.getElementById('sleepPhase'),
    noiseLevel: document.getElementById('noiseLevel'),
    movementCount: document.getElementById('movementCount'),
    sleepGraph: document.getElementById('sleepGraph')
};

// Tracking State
let trackingState = {
    isTracking: false,
    startTime: null,
    timerInterval: null,
    movementData: [],
    soundData: [],
    graphData: {
        labels: [],
        values: []
    }
};

// Initialize Chart
const sleepChart = new Chart(elements.sleepGraph, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Sleep Quality',
            data: [],
            borderColor: '#4A90E2',
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(74, 144, 226, 0.1)'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    stepSize: 20
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
});

// Start Tracking
async function startTracking() {
    try {
        // Request necessary permissions
        await requestPermissions();
        
        // Update state
        trackingState.isTracking = true;
        trackingState.startTime = new Date();
        
        // Start timer
        startTimer();
        
        // Start monitoring
        startMotionTracking();
        startSoundTracking();
        
        // Update UI
        elements.startTrackingBtn.textContent = 'Stop Tracking';
        elements.timerStatus.textContent = 'Tracking Sleep...';
        document.body.classList.add('tracking-active');
        
    } catch (error) {
        console.error('Error starting tracking:', error);
        alert('Could not start sleep tracking. Please check permissions.');
    }
}

// Stop Tracking
function stopTracking() {
    // Update state
    trackingState.isTracking = false;
    
    // Stop timer
    clearInterval(trackingState.timerInterval);
    
    // Stop monitoring
    stopMotionTracking();
    stopSoundTracking();
    
    // Calculate sleep data
    calculateSleepData();
    
    // Update UI
    elements.startTrackingBtn.textContent = 'Start Sleep Tracking';
    elements.timerStatus.textContent = 'Tracking Stopped';
    document.body.classList.remove('tracking-active');
}

// Timer Functions
function startTimer() {
    trackingState.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const now = new Date();
    const diff = now - trackingState.startTime;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    elements.hours.textContent = hours.toString().padStart(2, '0');
    elements.minutes.textContent = minutes.toString().padStart(2, '0');
    elements.seconds.textContent = seconds.toString().padStart(2, '0');
}

// Motion Tracking
function startMotionTracking() {
    window.addEventListener('devicemotion', handleMotion);
}

function stopMotionTracking() {
    window.removeEventListener('devicemotion', handleMotion);
}

function handleMotion(event) {
    if (!trackingState.isTracking) return;
    
    const { x, y, z } = event.acceleration;
    const movement = Math.sqrt(x * x + y * y + z * z);
    
    trackingState.movementData.push({
        timestamp: Date.now(),
        value: movement
    });
    
    // Update movement count
    const recentMovements = trackingState.movementData.filter(data => 
        data.value > 1 && Date.now() - data.timestamp < 60000
    ).length;
    
    elements.movementCount.textContent = recentMovements;
    
    // Update sleep phase
    updateSleepPhase(recentMovements);
}

// Sound Tracking
let audioContext;
let analyser;

async function startSoundTracking() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        // Start analyzing
        analyzeSound();
    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
}

function stopSoundTracking() {
    if (audioContext) {
        audioContext.close();
    }
}

function analyzeSound() {
    if (!trackingState.isTracking) return;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    
    trackingState.soundData.push({
        timestamp: Date.now(),
        value: average
    });
    
    // Update noise level
    updateNoiseLevel(average);
    
    // Continue analyzing
    requestAnimationFrame(analyzeSound);
}

// UI Update Functions
function updateSleepPhase(movementCount) {
    let phase;
    if (movementCount > 5) {
        phase = 'Awake';
    } else if (movementCount > 2) {
        phase = 'Light Sleep';
    } else {
        phase = 'Deep Sleep';
    }
    
    elements.sleepPhase.textContent = phase;
}

function updateNoiseLevel(average) {
    let level;
    if (average > 100) {
        level = 'Loud';
    } else if (average > 50) {
        level = 'Moderate';
    } else {
        level = 'Quiet';
    }
    
    elements.noiseLevel.textContent = level;
}

// Graph Update
function updateGraph() {
    if (!trackingState.isTracking) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Calculate quality score
    const quality = calculateQualityScore();
    
    // Update graph data
    trackingState.graphData.labels.push(timeString);
    trackingState.graphData.values.push(quality);
    
    // Keep only last 30 points
    if (trackingState.graphData.labels.length > 30) {
        trackingState.graphData.labels.shift();
        trackingState.graphData.values.shift();
    }
    
    // Update chart
    sleepChart.data.labels = trackingState.graphData.labels;
    sleepChart.data.datasets[0].data = trackingState.graphData.values;
    sleepChart.update();
    
    // Schedule next update
    setTimeout(updateGraph, 60000); // Update every minute
}

function calculateQualityScore() {
    const recentMovements = trackingState.movementData.filter(data => 
        Date.now() - data.timestamp < 300000
    ).length;
    
    const recentNoise = trackingState.soundData.filter(data => 
        Date.now() - data.timestamp < 300000
    ).reduce((sum, data) => sum + data.value, 0) / 5;
    
    // Calculate score based on movements and noise
    const movementScore = Math.max(0, 100 - (recentMovements * 10));
    const noiseScore = Math.max(0, 100 - (recentNoise / 2));
    
    return Math.round((movementScore + noiseScore) / 2);
}

// Calculate final sleep data
function calculateSleepData() {
    const duration = (new Date() - trackingState.startTime) / (1000 * 60 * 60);
    const movements = trackingState.movementData.length;
    const averageNoise = trackingState.soundData.reduce((sum, data) => sum + data.value, 0) / trackingState.soundData.length;
    
    // Save to localStorage
    const sleepData = {
        date: new Date().toISOString(),
        duration,
        movements,
        averageNoise,
        quality: calculateQualityScore()
    };
    
    // Get existing data
    const existingData = JSON.parse(localStorage.getItem('sleepData') || '[]');
    existingData.push(sleepData);
    localStorage.setItem('sleepData', JSON.stringify(existingData));
}

// Request permissions
async function requestPermissions() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        await DeviceMotionEvent.requestPermission();
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
}

// Event Listeners
elements.startTrackingBtn.addEventListener('click', () => {
    if (trackingState.isTracking) {
        stopTracking();
    } else {
        startTracking();
    }
}); 