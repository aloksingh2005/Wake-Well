// Prediction Preview Component
import { SleepPredictor } from './SleepPredictor.js';
import { TagEngine } from './TagEngine.js';

export class PredictionPreview {
    constructor() {
        this.predictor = new SleepPredictor(new TagEngine());
        this.container = null;
        this.selectedTags = new Set();
        this.debounceTimeout = null;
    }

    initialize(container) {
        this.container = container;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for tag selection changes
        document.addEventListener('tagFilterChanged', (event) => {
            const { tagId, isSelected } = event.detail;
            
            if (isSelected) {
                this.selectedTags.add(tagId);
            } else {
                this.selectedTags.delete(tagId);
            }
            
            this.updatePrediction();
        });

        // Listen for tag clear event
        document.addEventListener('tagFiltersCleared', () => {
            this.selectedTags.clear();
            this.hidePrediction();
        });
    }

    async updatePrediction() {
        if (this.selectedTags.size === 0) {
            this.hidePrediction();
            return;
        }

        // Show loading state
        this.container.style.display = 'block';
        this.container.classList.add('loading');

        // Debounce prediction updates
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(async () => {
            const tagEngine = new TagEngine();
            const selectedTagObjects = Array.from(this.selectedTags)
                .map(id => tagEngine.getUserTags().find(t => t.id === id))
                .filter(tag => tag); // Remove any undefined tags

            const prediction = await this.predictor.predictSleep(
                selectedTagObjects,
                new Date() // Use current time for prediction
            );

            this.updateUI(prediction);
        }, 300);
    }

    updateUI(prediction) {
        // Update confidence badge
        const confidenceBadge = document.getElementById('confidenceBadge');
        confidenceBadge.textContent = `${prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)} Confidence`;
        confidenceBadge.className = `confidence-badge ${prediction.confidence}`;

        // Update quality prediction
        const qualityEl = document.getElementById('predictedQuality');
        qualityEl.textContent = `${prediction.quality}%`;
        qualityEl.className = `stat-value quality-value ${this.getQualityClass(prediction.quality)}`;

        // Update duration prediction
        const durationEl = document.getElementById('predictedDuration');
        durationEl.textContent = this.formatDuration(prediction.duration);

        // Update insights
        const insightsContainer = document.getElementById('predictionInsights');
        insightsContainer.innerHTML = prediction.insights.map(insight => `
            <div class="insight-card ${insight.impact}">
                <div class="insight-icon">${this.getInsightIcon(insight)}</div>
                <div class="insight-content">
                    <div class="insight-description">${insight.message}</div>
                </div>
            </div>
        `).join('');

        // Update tips
        const tipsContainer = document.getElementById('predictionTips');
        if (prediction.tips && prediction.tips.length > 0) {
            tipsContainer.innerHTML = `
                <h3>Tips for Better Sleep</h3>
                ${prediction.tips.map(tip => `
                    <div class="tip-card">
                        <span class="tip-icon">${tip.icon}</span>
                        <span class="tip-text">${tip.text}</span>
                    </div>
                `).join('')}
            `;
        } else {
            tipsContainer.innerHTML = '';
        }

        // Remove loading state
        this.container.classList.remove('loading');
    }

    getQualityClass(quality) {
        if (quality >= 70) return '';
        if (quality >= 50) return 'fair';
        return 'poor';
    }

    getInsightIcon(insight) {
        switch (insight.type) {
            case 'time': return '🕒';
            case 'tag': return '🏷️';
            case 'combination': return '🔄';
            default: return insight.icon || '💡';
        }
    }

    formatDuration(hours) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    }

    hidePrediction() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
}
