/**
 * WakeWell - Morning Check-in Page Script
 * Handles morning check-in functionality
 */
import loadingManager from './utils/loading.js';
import toastManager from './utils/toast.js';

class MorningCheckinPage {
    constructor() {
        this.selectedMood = null;
        this.selectedRating = 0;
        this.selectedTags = [];
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadSleepSummary();
    }

    initializeElements() {
        // Mood buttons
        this.moodButtons = document.querySelectorAll('.mood-btn');
        
        // Star rating
        this.starButtons = document.querySelectorAll('.star-btn');
        this.ratingLabel = document.querySelector('.rating-label');
        
        // Tags
        this.tagButtons = document.querySelectorAll('.tag-btn');
        
        // Journal
        this.journalNotes = document.getElementById('journalNotes');
        this.charCount = document.querySelector('.char-count');
        
        // Voice note
        this.recordVoiceButton = document.getElementById('recordVoiceNote');
        this.voiceNoteStatus = document.getElementById('voiceNoteStatus');
        
        // Action buttons
        this.saveButton = document.getElementById('saveCheckin');
        this.skipButton = document.getElementById('skipCheckin');
        
        // Sleep stats
        this.sleepStats = document.querySelector('.sleep-stats');
    }

    initializeEventListeners() {
        // Mood selection
        this.moodButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.moodButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                this.selectedMood = button.dataset.mood;
            });
        });
        
        // Star rating
        this.starButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                this.selectedRating = index + 1;
                this.updateStarRating();
            });
            
            // Add hover effect
            button.addEventListener('mouseenter', () => {
                this.updateStarRating(index + 1, false);
            });
            
            button.addEventListener('mouseleave', () => {
                this.updateStarRating(this.selectedRating, false);
            });
        });
        
        // Tags
        this.tagButtons.forEach(button => {
            button.addEventListener('click', () => {
                button.classList.toggle('selected');
                
                const tag = button.dataset.tag;
                if (button.classList.contains('selected')) {
                    this.selectedTags.push(tag);
                } else {
                    this.selectedTags = this.selectedTags.filter(t => t !== tag);
                }
            });
        });
        
        // Journal character count
        this.journalNotes.addEventListener('input', () => {
            const count = this.journalNotes.value.length;
            this.charCount.textContent = `${count}/500`;
        });
        
        // Voice note recording
        this.recordVoiceButton.addEventListener('click', () => {
            this.toggleVoiceRecording();
        });
        
        // Save button
        this.saveButton.addEventListener('click', () => {
            this.saveCheckin();
        });
        
        // Skip button
        this.skipButton.addEventListener('click', () => {
            this.skipCheckin();
        });
    }

    loadSleepSummary() {
        try {
            loadingManager.show();
            
            // Get last sleep session from localStorage
            const sleepHistory = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
            const lastSleep = sleepHistory[sleepHistory.length - 1];
            
            if (lastSleep && this.sleepStats) {
                // Create sleep summary HTML
                const durationHours = Math.floor(lastSleep.duration / 3600);
                const durationMinutes = Math.floor((lastSleep.duration % 3600) / 60);
                
                const summaryHTML = `
                    <div class="sleep-stat">
                        <div class="stat-label">Duration</div>
                        <div class="stat-value">${durationHours}h ${durationMinutes}m</div>
                    </div>
                    <div class="sleep-stat">
                        <div class="stat-label">Quality</div>
                        <div class="stat-value">${lastSleep.quality}%</div>
                    </div>
                    <div class="sleep-stat">
                        <div class="stat-label">Movements</div>
                        <div class="stat-value">${lastSleep.movements}</div>
                    </div>
                `;
                
                this.sleepStats.innerHTML = summaryHTML;
            } else {
                // No sleep data
                if (this.sleepStats) {
                    this.sleepStats.innerHTML = '<p>No sleep data available from last night</p>';
                }
            }
            
            loadingManager.hide();
        } catch (error) {
            console.error('Error loading sleep summary:', error);
            toastManager.error('Failed to load sleep summary');
            loadingManager.hide();
        }
    }

    updateStarRating(rating = this.selectedRating, updateLabel = true) {
        // Update star buttons
        this.starButtons.forEach((button, index) => {
            if (index < rating) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Update label
        if (updateLabel) {
            const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
            this.ratingLabel.textContent = rating > 0 ? labels[rating] : 'Tap to rate';
        }
    }

    toggleVoiceRecording() {
        if (this.isRecording) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    }

    async startVoiceRecording() {
        try {
            // Check if browser supports recording
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toastManager.error('Voice recording is not supported in your browser');
                return;
            }
            
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create media recorder
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            // Set up event handlers
            this.mediaRecorder.addEventListener('dataavailable', event => {
                this.audioChunks.push(event.data);
            });
            
            this.mediaRecorder.addEventListener('stop', () => {
                // Create audio blob
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.audioUrl = URL.createObjectURL(audioBlob);
                
                // Update UI
                this.voiceNoteStatus.innerHTML = `
                    <div class="voice-note-preview">
                        <audio controls src="${this.audioUrl}"></audio>
                    </div>
                `;
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            });
            
            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Update UI
            this.recordVoiceButton.textContent = '🛑 Stop Recording';
            this.recordVoiceButton.classList.add('recording');
            this.voiceNoteStatus.textContent = 'Recording...';
            
            // Automatically stop after 30 seconds
            this.recordingTimeout = setTimeout(() => {
                if (this.isRecording) {
                    this.stopVoiceRecording();
                }
            }, 30000);
            
            toastManager.success('Recording started');
        } catch (error) {
            console.error('Error starting voice recording:', error);
            toastManager.error('Could not start recording');
        }
    }

    stopVoiceRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        // Stop recording
        this.mediaRecorder.stop();
        this.isRecording = false;
        
        // Clear timeout
        clearTimeout(this.recordingTimeout);
        
        // Update UI
        this.recordVoiceButton.textContent = '🎤 Record Voice Note';
        this.recordVoiceButton.classList.remove('recording');
        
        toastManager.success('Recording saved');
    }

    saveCheckin() {
        try {
            loadingManager.show();
            
            // Validate input
            if (!this.selectedMood) {
                toastManager.warning('Please select your mood');
                loadingManager.hide();
                return;
            }
            
            if (this.selectedRating === 0) {
                toastManager.warning('Please rate your sleep quality');
                loadingManager.hide();
                return;
            }
            
            // Create check-in data
            const checkinData = {
                date: new Date().toISOString(),
                mood: this.selectedMood,
                rating: this.selectedRating,
                tags: this.selectedTags,
                notes: this.journalNotes.value,
                hasVoiceNote: !!this.audioUrl
            };
            
            // If we have a voice note, convert to base64
            if (this.audioUrl) {
                // In a real app, you would upload this or store it properly
                // For this demo, we'll just note that it exists
                checkinData.voiceNote = true;
            }
            
            // Get existing check-in history
            const checkinHistory = JSON.parse(localStorage.getItem('checkinHistory') || '[]');
            
            // Add new entry
            checkinHistory.push(checkinData);
            
            // Save back to localStorage
            localStorage.setItem('checkinHistory', JSON.stringify(checkinHistory));
            
            toastManager.success('Morning check-in saved');
            
            // Redirect to home page after a delay
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } catch (error) {
            console.error('Error saving check-in:', error);
            toastManager.error('Failed to save check-in');
            loadingManager.hide();
        }
    }

    skipCheckin() {
        toastManager.info('Check-in skipped');
        
        // Redirect to home page
        window.location.href = '/';
    }
}

// Initialize morning check-in page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.morningCheckinPage = new MorningCheckinPage();
});
