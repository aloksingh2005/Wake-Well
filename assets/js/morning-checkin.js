import { showToast } from './utils/toast.js';
import { showLoading, hideLoading } from './utils/loading.js';
import { TagSuggestions } from './components/TagSuggestions.js';
import { EventTypes } from './utils/events.js';
import { TagSuggestions } from './components/TagSuggestions.js';
import { EventTypes } from './utils/events.js';

class MorningCheckin {
    constructor() {
        this.elements = {
            moodButtons: document.querySelectorAll('.mood-btn'),
            starButtons: document.querySelectorAll('.star-btn'),
            tagButtons: document.querySelectorAll('.tag-btn'),
            journalNotes: document.getElementById('journalNotes'),
            charCount: document.querySelector('.char-count'),
            recordButton: document.getElementById('recordVoiceNote'),
            voiceStatus: document.getElementById('voiceNoteStatus'),
            saveButton: document.getElementById('saveCheckin'),
            skipButton: document.getElementById('skipCheckin'),
            sleepStats: document.querySelector('.sleep-stats')
        };

        this.state = {
            selectedMood: null,
            sleepRating: 0,
            selectedTags: new Set(),
            voiceNote: null,
            mediaRecorder: null,
            isRecording: false
        };

        this.tagSuggestions = new TagSuggestions();

        this.initialize();
    }

    initialize() {
        this.loadLastNightSleepData();
        this.setupEventListeners();
        this.setupVoiceRecording();
        this.updateUI();
        this.initializeTagSystem();
    }

    initializeTagSystem() {
        const container = document.getElementById('tagSuggestions');
        this.tagSuggestions.createUI(container);

        // Listen for tag applications
        document.addEventListener(EventTypes.TAG_APPLIED, (event) => {
            const { tag } = event.detail;
            this.addTagToJournal(tag);
        });
    }

    addTagToJournal(tag) {
        const tagsList = document.getElementById('appliedTagsList');
        const tagEl = document.createElement('div');
        tagEl.className = 'journal-tag';
        tagEl.innerHTML = `
            <span class="tag-emoji">${tag.emoji}</span>
            <span class="tag-name">${tag.name}</span>
            <button class="remove-tag" data-tag-id="${tag.id}">×</button>
        `;
        tagsList.appendChild(tagEl);

        // Add to journal data
        if (!this.journalData.tags) {
            this.journalData.tags = [];
        }
        this.journalData.tags.push(tag);
    }

    async loadLastNightSleepData() {
        try {
            const sleepHistory = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
            const lastSleep = sleepHistory[sleepHistory.length - 1];

            if (lastSleep) {
                this.elements.sleepStats.innerHTML = `
                    <div class="stat">
                        <span class="label">Duration</span>
                        <span class="value">${this.formatDuration(lastSleep.duration)}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Quality</span>
                        <span class="value">${this.formatQuality(lastSleep.quality)}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Disturbances</span>
                        <span class="value">${lastSleep.disturbances}</span>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading sleep data:', error);
        }
    }

    setupEventListeners() {
        // Mood selection
        this.elements.moodButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.moodButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.state.selectedMood = {
                    mood: btn.dataset.mood,
                    emoji: btn.dataset.emoji
                };
            });
        });

        // Star rating
        this.elements.starButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const rating = parseInt(btn.dataset.rating);
                this.state.sleepRating = rating;
                this.updateStarRating();
            });
        });

        // Tags
        this.elements.tagButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('selected');
                const tag = btn.dataset.tag;
                if (this.state.selectedTags.has(tag)) {
                    this.state.selectedTags.delete(tag);
                } else {
                    this.state.selectedTags.add(tag);
                }
            });
        });

        // Journal notes character count
        this.elements.journalNotes.addEventListener('input', () => {
            const length = this.elements.journalNotes.value.length;
            this.elements.charCount.textContent = `${length}/500`;
        });

        // Save check-in
        this.elements.saveButton.addEventListener('click', () => this.saveCheckin());
        
        // Skip check-in
        this.elements.skipButton.addEventListener('click', () => this.skipCheckin());
    }

    async setupVoiceRecording() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.elements.recordButton.style.display = 'none';
                return;
            }

            this.elements.recordButton.addEventListener('click', () => {
                if (this.state.isRecording) {
                    this.stopRecording();
                } else {
                    this.startRecording();
                }
            });
        } catch (error) {
            console.error('Voice recording not supported:', error);
            this.elements.recordButton.style.display = 'none';
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.state.mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            this.state.mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            this.state.mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks);
                this.state.voiceNote = audioBlob;
                this.elements.voiceStatus.textContent = '🎵 Voice note recorded';
            });

            this.state.mediaRecorder.start();
            this.state.isRecording = true;
            this.elements.recordButton.classList.add('recording');
            this.elements.recordButton.textContent = '⏹️ Stop Recording';
            this.elements.voiceStatus.textContent = '🎤 Recording...';
        } catch (error) {
            console.error('Error starting recording:', error);
            showToast('Could not start recording', 'error');
        }
    }

    stopRecording() {
        if (this.state.mediaRecorder) {
            this.state.mediaRecorder.stop();
            this.state.isRecording = false;
            this.elements.recordButton.classList.remove('recording');
            this.elements.recordButton.textContent = '🎤 Record Voice Note';
        }
    }

    updateStarRating() {
        this.elements.starButtons.forEach((btn, index) => {
            if (index < this.state.sleepRating) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        const labels = ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];
        this.elements.starButtons[0].parentElement.nextElementSibling.textContent = 
            this.state.sleepRating ? labels[this.state.sleepRating - 1] : 'Tap to rate';
    }

    async saveCheckin() {
        if (!this.state.selectedMood || !this.state.sleepRating) {
            showToast('Please select your mood and rate your sleep', 'error');
            return;
        }

        showLoading('Saving your check-in...');

        try {
            const checkin = {
                date: new Date().toISOString(),
                mood: this.state.selectedMood,
                sleepRating: this.state.sleepRating,
                tags: Array.from(this.state.selectedTags),
                notes: this.elements.journalNotes.value,
                hasVoiceNote: !!this.state.voiceNote
            };

            // Save check-in data
            let journalData = JSON.parse(localStorage.getItem('sleepJournal') || '[]');
            journalData.push(checkin);
            localStorage.setItem('sleepJournal', JSON.stringify(journalData));

            // Save voice note if exists
            if (this.state.voiceNote) {
                const reader = new FileReader();
                reader.readAsDataURL(this.state.voiceNote);
                reader.onloadend = () => {
                    let voiceNotes = JSON.parse(localStorage.getItem('voiceNotes') || '[]');
                    voiceNotes.push({
                        date: checkin.date,
                        audio: reader.result
                    });
                    localStorage.setItem('voiceNotes', JSON.stringify(voiceNotes));
                };
            }

            showToast('Check-in saved successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'reports.html';
            }, 1500);
        } catch (error) {
            console.error('Error saving check-in:', error);
            showToast('Failed to save check-in', 'error');
        } finally {
            hideLoading();
        }
    }

    skipCheckin() {
        if (confirm('Are you sure you want to skip the morning check-in?')) {
            window.location.href = 'index.html';
        }
    }

    formatDuration(hours) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    }

    formatQuality(score) {
        if (score >= 90) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Fair';
        return 'Poor';
    }

    async processSleepData() {
        // ...existing sleep data processing...
        
        // Get sleep history for context
        const sleepHistory = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
        
        // Show tag suggestions based on sleep data
        this.tagSuggestions.showSuggestions(this.sleepData, sleepHistory);
        
        // ...rest of the existing code...
    }
}

// Initialize morning check-in
document.addEventListener('DOMContentLoaded', () => {
    const morningCheckin = new MorningCheckin();
});
