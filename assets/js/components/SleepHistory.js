import { TagEngine } from './TagEngine.js';

// Sleep History Component
export class SleepHistory {
    constructor() {
        this.tagEngine = new TagEngine();
        this.history = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
        this.container = document.createElement('div');
        this.container.className = 'sleep-history';
    }

    addEntry(sleepData) {
        const entry = {
            date: new Date().toISOString(),
            startTime: sleepData.startTime,
            endTime: sleepData.endTime,
            duration: sleepData.endTime - sleepData.startTime,
            score: sleepData.score,
            disturbances: sleepData.disturbances,
            tags: sleepData.tags // Include tags in the entry
        };

        this.history.unshift(entry);
        this.history = this.history.slice(0, 30); // Keep only last 30 entries
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('sleepHistory', JSON.stringify(this.history));
    }

    getAverageScore() {
        if (this.history.length === 0) return 0;
        const sum = this.history.reduce((acc, entry) => acc + entry.score, 0);
        return Math.round(sum / this.history.length);
    }

    getAverageDuration() {
        if (this.history.length === 0) return 0;
        const sum = this.history.reduce((acc, entry) => acc + entry.duration, 0);
        return Math.round(sum / this.history.length / (1000 * 60 * 60) * 10) / 10; // in hours
    }

    render() {
        if (this.history.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <p>No sleep data available yet.</p>
                    <p>Start tracking your sleep to see your history here.</p>
                </div>
            `;
            return this.container;
        }

        const averageScore = this.getAverageScore();
        const averageDuration = this.getAverageDuration();

        let historyHTML = `
            <div class="sleep-stats">
                <div class="stat">
                    <span class="value">${averageScore}</span>
                    <span class="label">Avg. Score</span>
                </div>
                <div class="stat">
                    <span class="value">${averageDuration}h</span>
                    <span class="label">Avg. Duration</span>
                </div>
                <div class="stat">
                    <span class="value">${this.history.length}</span>
                    <span class="label">Total Sessions</span>
                </div>
            </div>
            <div class="history-list">
                <h3>Recent Sessions</h3>
        `;

        this.history.slice(0, 5).forEach(entry => {
            const date = new Date(entry.date);
            const durationHours = Math.floor(entry.duration / (1000 * 60 * 60));
            const durationMins = Math.floor((entry.duration % (1000 * 60 * 60)) / (1000 * 60));
            
            historyHTML += `
                <div class="history-item">
                    <div class="history-date">${date.toLocaleDateString()}</div>
                    <div class="history-details">
                        <span class="history-score">${entry.score}</span>
                        <span class="history-duration">${durationHours}h ${durationMins}m</span>
                        <span class="history-disturbances">${entry.disturbances} disturbances</span>
                    </div>
                </div>
            `;
        });

        historyHTML += '</div>';
        this.container.innerHTML = historyHTML;
        return this.container;
    }

    renderHistoryEntry(entry) {
        const entryEl = document.createElement('div');
        entryEl.className = 'history-entry';
        
        const date = new Date(entry.date);
        const quality = Math.round(entry.quality);
        const duration = this.formatDuration(entry.duration);

        entryEl.innerHTML = `
            <div class="entry-header">
                <div class="entry-date">${date.toLocaleDateString()}</div>
                <div class="entry-score ${this.getScoreClass(quality)}">${quality}</div>
            </div>
            <div class="entry-details">
                <div class="entry-stat">
                    <span class="stat-label">Duration</span>
                    <span class="stat-value">${duration}</span>
                </div>
                <div class="entry-stat">
                    <span class="stat-label">Quality</span>
                    <span class="stat-value">${this.getQualityLabel(quality)}</span>
                </div>
            </div>
            ${entry.tags ? this.renderTags(entry.tags) : ''}
        `;

        return entryEl;
    }

    renderTags(tags) {
        return `
            <div class="entry-tags">
                ${tags.map(tag => `
                    <span class="history-tag">
                        <span class="tag-emoji">${tag.emoji}</span>
                        <span class="tag-name">${tag.name}</span>
                    </span>
                `).join('')}
            </div>
        `;
    }

    renderTagStats() {
        const stats = this.tagEngine.getTagStats(this.history);
        const container = document.createElement('div');
        container.className = 'tag-stats-container';

        // Sort tags by frequency
        const sortedTags = Object.entries(stats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5); // Top 5 tags

        if (sortedTags.length > 0) {
            container.innerHTML = `
                <div class="tag-stats-header">
                    <h3>Most Common Tags</h3>
                    <div class="tag-stats-info">
                        Based on your last ${this.history.length} entries
                    </div>
                </div>
                <div class="tag-stats-grid">
                    ${sortedTags.map(([tagId, count]) => {
                        const tag = this.findTagById(tagId);
                        if (!tag) return '';
                        
                        const percentage = Math.round((count / this.history.length) * 100);
                        return `
                            <div class="tag-stat-item">
                                <div class="tag-stat-header">
                                    <span class="tag-emoji">${tag.emoji}</span>
                                    <span class="tag-name">${tag.name}</span>
                                </div>
                                <div class="tag-stat-bar">
                                    <div class="tag-stat-fill" style="width: ${percentage}%"></div>
                                </div>
                                <div class="tag-stat-value">${percentage}%</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        return container;
    }

    findTagById(tagId) {
        const allTags = this.tagEngine.getUserTags();
        return allTags.find(tag => tag.id === tagId);
    }

    getScoreClass(quality) {
        if (quality >= 90) return 'excellent';
        if (quality >= 70) return 'good';
        if (quality >= 50) return 'fair';
        return 'poor';
    }

    getQualityLabel(quality) {
        if (quality >= 90) return 'Excellent';
        if (quality >= 70) return 'Good';
        if (quality >= 50) return 'Fair';
        return 'Poor';
    }

    formatDuration(duration) {
        const hours = Math.floor(duration);
        const minutes = Math.round((duration - hours) * 60);
        return `${hours}h ${minutes}m`;
    }
}
