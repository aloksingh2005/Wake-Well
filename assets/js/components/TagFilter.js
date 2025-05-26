// Tag Filter Component
import { TagEngine } from './TagEngine.js';
import { EventTypes } from '../utils/events.js';

export class TagFilter {
    constructor() {
        this.tagEngine = new TagEngine();
        this.activeFilters = new Set();
        this.filteredData = null;
        this.originalData = null;
        this.charts = null;
    }

    initialize(container, charts) {
        this.charts = charts;
        this.setupUI(container);
        this.bindEvents();
    }

    setupUI(container) {
        const tagSelector = container.querySelector('#tagSelector');
        const userTags = this.tagEngine.getUserTags();

        tagSelector.innerHTML = userTags.map(tag => `
            <div class="tag-option" data-tag-id="${tag.id}">
                <span class="tag-emoji">${tag.emoji}</span>
                <span class="tag-name">${tag.name}</span>
            </div>
        `).join('');
    }

    bindEvents() {
        const tagSelector = document.getElementById('tagSelector');
        const clearFiltersBtn = document.getElementById('clearFilters');

        tagSelector.addEventListener('click', (e) => {
            const tagOption = e.target.closest('.tag-option');
            if (tagOption) {
                const tagId = tagOption.dataset.tagId;
                this.toggleFilter(tagId);
            }
        });

        clearFiltersBtn.addEventListener('click', () => {
            this.clearFilters();
        });

        // Listen for new sleep data
        document.addEventListener(EventTypes.SLEEP_DATA_UPDATED, () => {
            this.updateFilteredData();
        });
    }

    toggleFilter(tagId) {
        const tag = this.tagEngine.getUserTags().find(t => t.id === tagId);
        if (!tag) return;

        const isSelected = !this.activeFilters.has(tagId);
        
        if (isSelected) {
            this.activeFilters.add(tagId);
            this.addActiveFilterUI(tag);
        } else {
            this.activeFilters.delete(tagId);
            this.removeActiveFilterUI(tagId);
        }

        // Dispatch tag filter change event
        document.dispatchEvent(new CustomEvent('tagFilterChanged', {
            detail: { tagId, isSelected, tag }
        }));

        this.updateFilteredData();
        this.updateClearFiltersButton();
    }

    addActiveFilterUI(tag) {
        const activeFilters = document.getElementById('activeFilters');
        const filterEl = document.createElement('div');
        filterEl.className = 'active-filter';
        filterEl.dataset.tagId = tag.id;
        filterEl.innerHTML = `
            <span class="tag-emoji">${tag.emoji}</span>
            <span class="tag-name">${tag.name}</span>
            <button class="remove-filter" aria-label="Remove filter">×</button>
        `;

        filterEl.querySelector('.remove-filter').addEventListener('click', () => {
            this.toggleFilter(tag.id);
        });

        activeFilters.appendChild(filterEl);
    }

    removeActiveFilterUI(tagId) {
        const filterEl = document.querySelector(`.active-filter[data-tag-id="${tagId}"]`);
        if (filterEl) {
            filterEl.addEventListener('animationend', () => filterEl.remove());
            filterEl.style.animation = 'scaleIn 0.2s ease reverse';
        }
    }

    updateFilteredData() {
        if (this.activeFilters.size === 0) {
            this.filteredData = null;
            this.updateCharts(false);
            this.updateFilterInfo(null);
            return;
        }

        const sleepHistory = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
        this.filteredData = sleepHistory.filter(entry => 
            entry.tags && entry.tags.some(tag => this.activeFilters.has(tag.id))
        );

        this.updateCharts(true);
        this.updateFilterInfo(this.filteredData);
    }

    updateCharts(isFiltered) {
        const data = this.filteredData || JSON.parse(localStorage.getItem('sleepHistory') || '[]');
        
        // Update each chart with filtered data
        Object.entries(this.charts).forEach(([chartType, chart]) => {
            const chartContainer = chart.canvas.closest('.reports-card');
            
            // Update filtered UI state
            if (isFiltered) {
                chartContainer.classList.add('filtered');
                if (!chartContainer.querySelector('.filtered-label')) {
                    const label = document.createElement('div');
                    label.className = 'filtered-label';
                    label.textContent = 'Filtered View';
                    chartContainer.appendChild(label);
                }
            } else {
                chartContainer.classList.remove('filtered');
                const label = chartContainer.querySelector('.filtered-label');
                if (label) label.remove();
            }

            // Update chart data
            switch (chartType) {
                case 'duration':
                    chart.data = this.getDurationChartData(data);
                    break;
                case 'quality':
                    chart.data = this.getQualityChartData(data);
                    break;
                case 'phases':
                    chart.data = this.getPhasesChartData(data);
                    break;
                case 'mood':
                    chart.data = this.getMoodCorrelationData(data);
                    break;
            }
            
            chart.update();
        });
    }

    updateFilterInfo(filteredData) {
        const filterInfo = document.getElementById('filterInfo');
        
        if (!filteredData) {
            filterInfo.textContent = '';
            return;
        }

        const totalEntries = JSON.parse(localStorage.getItem('sleepHistory') || '[]').length;
        const filteredCount = filteredData.length;
        const percentage = Math.round((filteredCount / totalEntries) * 100);

        filterInfo.textContent = `Showing ${filteredCount} out of ${totalEntries} entries (${percentage}%)`;
    }

    updateClearFiltersButton() {
        const clearFiltersBtn = document.getElementById('clearFilters');
        clearFiltersBtn.disabled = this.activeFilters.size === 0;
    }

    clearFilters() {
        this.activeFilters.clear();
        document.getElementById('activeFilters').innerHTML = '';
        
        // Dispatch tag filters cleared event
        document.dispatchEvent(new CustomEvent('tagFiltersCleared'));
        
        this.updateFilteredData();
        this.updateClearFiltersButton();
    }
    
    // Chart data generation methods
    getDurationChartData(data) {
        // Implementation from reports.js
        return {
            labels: data.map(entry => new Date(entry.date).toLocaleDateString()),
            datasets: [{
                label: 'Sleep Duration',
                data: data.map(entry => entry.duration),
                borderColor: '#4299e1',
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
    }

    getQualityChartData(data) {
        // Implementation from reports.js
        return {
            labels: data.map(entry => new Date(entry.date).toLocaleDateString()),
            datasets: [{
                label: 'Sleep Quality',
                data: data.map(entry => entry.quality),
                backgroundColor: '#48bb78',
                borderColor: '#38a169',
                borderWidth: 1
            }]
        };
    }

    getPhasesChartData(data) {
        // Implementation from reports.js
        const phases = ['Deep', 'Light', 'REM'];
        const averages = phases.map(phase => {
            const values = data.map(entry => entry.phases[phase.toLowerCase()] || 0);
            return values.reduce((sum, val) => sum + val, 0) / values.length;
        });

        return {
            labels: phases,
            datasets: [{
                data: averages,
                backgroundColor: ['#4299e1', '#48bb78', '#9f7aea'],
                borderWidth: 0
            }]
        };
    }

    getMoodCorrelationData(data) {
        // Implementation from reports.js
        return {
            datasets: [{
                label: 'Sleep vs Mood',
                data: data.map(entry => ({
                    x: entry.duration,
                    y: entry.moodScore
                })),
                backgroundColor: '#ed64a6',
                borderColor: '#d53f8c'
            }]
        };
    }
}
