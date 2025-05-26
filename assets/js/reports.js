/**
 * WakeWell - Reports Page Script
 * Handles reports and analytics functionality
 */
import loadingManager from './utils/loading.js';
import toastManager from './utils/toast.js';

class ReportsPage {
    constructor() {
        this.currentRange = 'week';
        this.activeFilters = new Set();
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadSleepData();
    }

    initializeElements() {
        // Range selector
        this.rangeButtons = document.querySelectorAll('.range-btn');
        
        // Filter elements
        this.tagSelector = document.getElementById('tagSelector');
        this.activeFiltersContainer = document.getElementById('activeFilters');
        this.clearFiltersButton = document.getElementById('clearFilters');
        this.filterInfo = document.getElementById('filterInfo');
        
        // Calendar elements
        this.currentMonthElement = document.getElementById('currentMonth');
        this.prevMonthButton = document.getElementById('prevMonth');
        this.nextMonthButton = document.getElementById('nextMonth');
        this.calendarDays = document.getElementById('calendarDays');
        
        // Charts
        this.durationChart = document.getElementById('durationChart');
        this.qualityChart = document.getElementById('qualityChart');
        this.phasesChart = document.getElementById('phasesChart');
        this.moodCorrelationChart = document.getElementById('moodCorrelationChart');
        
        // Sleep overview
        this.avgDuration = document.getElementById('avgDuration');
        this.avgQuality = document.getElementById('avgQuality');
        this.bestSleep = document.getElementById('bestSleep');
        
        // Insights
        this.sleepInsights = document.getElementById('sleepInsights');
        
        // Export buttons
        this.exportPDFButton = document.getElementById('exportPDF');
        this.exportCSVButton = document.getElementById('exportCSV');
    }

    initializeEventListeners() {
        // Range selection
        this.rangeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.rangeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.currentRange = button.dataset.range;
                this.loadSleepData();
            });
        });
        
        // Clear filters
        this.clearFiltersButton.addEventListener('click', () => {
            this.clearFilters();
        });
        
        // Calendar navigation
        if (this.prevMonthButton && this.nextMonthButton) {
            this.prevMonthButton.addEventListener('click', () => {
                this.navigateMonth(-1);
            });
            
            this.nextMonthButton.addEventListener('click', () => {
                this.navigateMonth(1);
            });
        }
        
        // Export buttons
        if (this.exportPDFButton) {
            this.exportPDFButton.addEventListener('click', () => {
                this.exportData('pdf');
            });
        }
        
        if (this.exportCSVButton) {
            this.exportCSVButton.addEventListener('click', () => {
                this.exportData('csv');
            });
        }
    }

    loadSleepData() {
        try {
            loadingManager.show();
            
            // Get sleep data from localStorage
            const sleepHistory = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
            
            // Filter data based on selected range
            const filteredData = this.filterDataByRange(sleepHistory, this.currentRange);
            
            // Update UI with filtered data
            this.updateOverviewStats(filteredData);
            this.createCharts(filteredData);
            this.generateInsights(filteredData);
            this.populateCalendar(filteredData);
            this.populateTagSelector(filteredData);
            
            loadingManager.hide();
        } catch (error) {
            console.error('Error loading sleep data:', error);
            toastManager.error('Failed to load sleep data');
            loadingManager.hide();
        }
    }

    filterDataByRange(data, range) {
        const now = new Date();
        let startDate;
        
        switch (range) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
        }
        
        return data.filter(item => new Date(item.date) >= startDate);
    }

    updateOverviewStats(data) {
        if (!data.length) {
            if (this.avgDuration) this.avgDuration.textContent = '0h';
            if (this.avgQuality) this.avgQuality.textContent = '0%';
            if (this.bestSleep) this.bestSleep.textContent = '0h';
            return;
        }
        
        // Calculate average duration
        const totalDuration = data.reduce((sum, item) => sum + item.duration, 0);
        const avgDurationHours = totalDuration / data.length / 3600;
        const hours = Math.floor(avgDurationHours);
        const minutes = Math.round((avgDurationHours - hours) * 60);
        
        // Calculate average quality
        const totalQuality = data.reduce((sum, item) => sum + item.quality, 0);
        const avgQuality = Math.round(totalQuality / data.length);
        
        // Find best sleep
        const bestSleepItem = data.reduce((best, item) => 
            item.quality > best.quality ? item : best, data[0]);
        const bestDuration = bestSleepItem.duration / 3600;
        const bestHours = Math.floor(bestDuration);
        const bestMinutes = Math.round((bestDuration - bestHours) * 60);
        
        // Update UI
        if (this.avgDuration) this.avgDuration.textContent = `${hours}h ${minutes}m`;
        if (this.avgQuality) this.avgQuality.textContent = `${avgQuality}%`;
        if (this.bestSleep) this.bestSleep.textContent = `${bestHours}h ${bestMinutes}m`;
    }

    createCharts(data) {
        if (!data.length) return;
        
        this.createDurationChart(data);
        this.createQualityChart(data);
        this.createPhasesChart(data);
        this.createMoodCorrelationChart(data);
    }

    createDurationChart(data) {
        if (!this.durationChart) return;
        
        const ctx = this.durationChart.getContext('2d');
        
        // Prepare data
        const labels = data.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const durations = data.map(item => item.duration / 3600); // Convert to hours
        
        // Create chart
        if (window.durationChartInstance) {
            window.durationChartInstance.destroy();
        }
        
        window.durationChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sleep Duration (hours)',
                    data: durations,
                    borderColor: '#4299e1',
                    backgroundColor: 'rgba(66, 153, 225, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                }
            }
        });
    }

    createQualityChart(data) {
        if (!this.qualityChart) return;
        
        const ctx = this.qualityChart.getContext('2d');
        
        // Prepare data
        const labels = data.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const qualities = data.map(item => item.quality);
        
        // Create chart
        if (window.qualityChartInstance) {
            window.qualityChartInstance.destroy();
        }
        
        window.qualityChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sleep Quality (%)',
                    data: qualities,
                    backgroundColor: qualities.map(quality => {
                        if (quality >= 80) return 'rgba(72, 187, 120, 0.7)'; // Green
                        if (quality >= 60) return 'rgba(66, 153, 225, 0.7)'; // Blue
                        if (quality >= 40) return 'rgba(237, 137, 54, 0.7)'; // Orange
                        return 'rgba(229, 62, 62, 0.7)'; // Red
                    })
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Quality (%)'
                        }
                    }
                }
            }
        });
    }

    createPhasesChart(data) {
        if (!this.phasesChart) return;
        
        const ctx = this.phasesChart.getContext('2d');
        
        // Simulate sleep phases data
        // In a real app, this would come from actual sleep phase tracking
        const lightSleep = Math.round(data.reduce((sum, item) => sum + (item.duration * 0.5), 0) / data.length);
        const deepSleep = Math.round(data.reduce((sum, item) => sum + (item.duration * 0.3), 0) / data.length);
        const remSleep = Math.round(data.reduce((sum, item) => sum + (item.duration * 0.2), 0) / data.length);
        
        // Create chart
        if (window.phasesChartInstance) {
            window.phasesChartInstance.destroy();
        }
        
        window.phasesChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Light Sleep', 'Deep Sleep', 'REM Sleep'],
                datasets: [{
                    data: [lightSleep, deepSleep, remSleep],
                    backgroundColor: [
                        'rgba(66, 153, 225, 0.7)', // Blue
                        'rgba(72, 187, 120, 0.7)', // Green
                        'rgba(237, 137, 54, 0.7)'  // Orange
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    createMoodCorrelationChart(data) {
        if (!this.moodCorrelationChart) return;
        
        // In a real app, this would correlate with morning check-in data
        // For now, just create a placeholder chart
        
        const ctx = this.moodCorrelationChart.getContext('2d');
        
        // Create chart
        if (window.moodChartInstance) {
            window.moodChartInstance.destroy();
        }
        
        window.moodChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Energized', 'Calm', 'Okay', 'Groggy', 'Irritated'],
                datasets: [{
                    label: 'Sleep Quality',
                    data: [85, 75, 60, 40, 30],
                    backgroundColor: 'rgba(66, 153, 225, 0.2)',
                    borderColor: 'rgba(66, 153, 225, 1)',
                    pointBackgroundColor: 'rgba(66, 153, 225, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    generateInsights(data) {
        if (!this.sleepInsights || !data.length) return;
        
        // Clear previous insights
        this.sleepInsights.innerHTML = '';
        
        // Calculate average metrics
        const avgDuration = data.reduce((sum, item) => sum + item.duration, 0) / data.length;
        const avgQuality = data.reduce((sum, item) => sum + item.quality, 0) / data.length;
        
        // Generate insights based on data
        const insights = [];
        
        // Duration insights
        if (avgDuration < 6 * 3600) {
            insights.push({
                icon: '⚠️',
                title: 'Sleep Duration',
                message: 'Your average sleep duration is below recommended levels. Aim for 7-9 hours of sleep.'
            });
        } else if (avgDuration > 9 * 3600) {
            insights.push({
                icon: 'ℹ️',
                title: 'Sleep Duration',
                message: 'Your average sleep duration is above recommended levels. Too much sleep can also affect your health.'
            });
        } else {
            insights.push({
                icon: '✅',
                title: 'Sleep Duration',
                message: 'Your sleep duration is within the recommended range. Keep it up!'
            });
        }
        
        // Quality insights
        if (avgQuality < 50) {
            insights.push({
                icon: '⚠️',
                title: 'Sleep Quality',
                message: 'Your sleep quality is below average. Consider improving your sleep environment.'
            });
        } else if (avgQuality > 80) {
            insights.push({
                icon: '🌟',
                title: 'Sleep Quality',
                message: 'Your sleep quality is excellent! Whatever you\'re doing, keep it up!'
            });
        }
        
        // Consistency insights
        const durations = data.map(item => item.duration);
        const durationVariance = this.calculateVariance(durations);
        
        if (durationVariance > 2 * 3600 * 3600) { // High variance (2+ hours)
            insights.push({
                icon: '📊',
                title: 'Sleep Consistency',
                message: 'Your sleep schedule is inconsistent. Try to maintain regular sleep and wake times.'
            });
        } else {
            insights.push({
                icon: '🔄',
                title: 'Sleep Consistency',
                message: 'You have a consistent sleep schedule. This is great for your circadian rhythm!'
            });
        }
        
        // Render insights
        insights.forEach(insight => {
            const insightElement = document.createElement('div');
            insightElement.className = 'insight-item';
            insightElement.innerHTML = `
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <h3>${insight.title}</h3>
                    <p>${insight.message}</p>
                </div>
            `;
            this.sleepInsights.appendChild(insightElement);
        });
    }

    calculateVariance(arr) {
        const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
        return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    }

    populateCalendar(data) {
        if (!this.calendarDays || !this.currentMonthElement) return;
        
        // Set current month display
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        this.currentMonthElement.textContent = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // Clear calendar
        this.calendarDays.innerHTML = '';
        
        // Get days in month
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Get first day of month
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        
        // Create calendar grid
        // Add empty cells for days before the first of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            this.calendarDays.appendChild(emptyCell);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateString = date.toISOString().split('T')[0];
            
            // Find sleep data for this day
            const sleepData = data.find(item => {
                const itemDate = new Date(item.date);
                return itemDate.getDate() === day && 
                       itemDate.getMonth() === currentMonth && 
                       itemDate.getFullYear() === currentYear;
            });
            
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;
            
            // Add today class if it's today
            if (day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()) {
                dayCell.classList.add('today');
            }
            
            // Add quality class if we have sleep data
            if (sleepData) {
                let qualityClass = '';
                if (sleepData.quality >= 80) qualityClass = 'excellent';
                else if (sleepData.quality >= 60) qualityClass = 'good';
                else if (sleepData.quality >= 40) qualityClass = 'fair';
                else qualityClass = 'poor';
                
                dayCell.classList.add(qualityClass);
                
                // Add tooltip with sleep info
                dayCell.title = `Duration: ${Math.floor(sleepData.duration / 3600)}h ${Math.floor((sleepData.duration % 3600) / 60)}m\nQuality: ${sleepData.quality}%`;
            }
            
            this.calendarDays.appendChild(dayCell);
        }
    }

    populateTagSelector(data) {
        if (!this.tagSelector) return;
        
        // Clear previous tags
        this.tagSelector.innerHTML = '';
        
        // Get all unique tags from check-in data
        const checkinHistory = JSON.parse(localStorage.getItem('checkinHistory') || '[]');
        const allTags = new Set();
        
        checkinHistory.forEach(checkin => {
            if (checkin.tags && Array.isArray(checkin.tags)) {
                checkin.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        // Create tag buttons
        allTags.forEach(tag => {
            const tagButton = document.createElement('button');
            tagButton.className = 'filter-tag';
            tagButton.textContent = tag;
            tagButton.dataset.tag = tag;
            
            // Add selected class if tag is in active filters
            if (this.activeFilters.has(tag)) {
                tagButton.classList.add('selected');
            }
            
            // Add click event
            tagButton.addEventListener('click', () => {
                tagButton.classList.toggle('selected');
                
                if (tagButton.classList.contains('selected')) {
                    this.activeFilters.add(tag);
                } else {
                    this.activeFilters.delete(tag);
                }
                
                this.updateActiveFilters();
                this.applyFilters();
            });
            
            this.tagSelector.appendChild(tagButton);
        });
        
        // Update filter display
        this.updateActiveFilters();
    }

    updateActiveFilters() {
        if (!this.activeFiltersContainer || !this.clearFiltersButton) return;
        
        // Clear previous filters
        this.activeFiltersContainer.innerHTML = '';
        
        // Add active filters
        this.activeFilters.forEach(tag => {
            const filterTag = document.createElement('div');
            filterTag.className = 'active-filter';
            filterTag.innerHTML = `
                ${tag}
                <button class="remove-filter" data-tag="${tag}">×</button>
            `;
            
            // Add click event to remove button
            filterTag.querySelector('.remove-filter').addEventListener('click', () => {
                this.activeFilters.delete(tag);
                this.updateActiveFilters();
                this.applyFilters();
                
                // Update tag selector
                const tagButton = this.tagSelector.querySelector(`[data-tag="${tag}"]`);
                if (tagButton) {
                    tagButton.classList.remove('selected');
                }
            });
            
            this.activeFiltersContainer.appendChild(filterTag);
        });
        
        // Update clear filters button
        this.clearFiltersButton.disabled = this.activeFilters.size === 0;
        
        // Update filter info
        if (this.filterInfo) {
            if (this.activeFilters.size > 0) {
                this.filterInfo.textContent = `Showing data filtered by ${this.activeFilters.size} tag(s)`;
            } else {
                this.filterInfo.textContent = 'No filters applied';
            }
        }
    }

    clearFilters() {
        this.activeFilters.clear();
        this.updateActiveFilters();
        this.applyFilters();
        
        // Update tag selector
        const tagButtons = this.tagSelector.querySelectorAll('.filter-tag');
        tagButtons.forEach(button => button.classList.remove('selected'));
    }

    applyFilters() {
        // In a real app, this would filter the data based on tags
        // For now, just reload the data
        this.loadSleepData();
    }

    navigateMonth(direction) {
        // In a real app, this would change the month displayed in the calendar
        // For now, just show a message
        toastManager.info('Calendar navigation not implemented in this demo');
    }

    exportData(format) {
        try {
            loadingManager.show();
            
            // Get sleep data
            const sleepHistory = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
            
            if (sleepHistory.length === 0) {
                toastManager.warning('No sleep data to export');
                loadingManager.hide();
                return;
            }
            
            if (format === 'csv') {
                this.exportCSV(sleepHistory);
            } else {
                this.exportPDF(sleepHistory);
            }
            
            loadingManager.hide();
        } catch (error) {
            console.error(`Error exporting ${format}:`, error);
            toastManager.error(`Failed to export ${format}`);
            loadingManager.hide();
        }
    }

    exportCSV(data) {
        // Create CSV content
        let csvContent = 'Date,Start Time,End Time,Duration (hours),Quality (%),Movements\n';
        
        data.forEach(item => {
            const date = new Date(item.date).toLocaleDateString();
            const startTime = new Date(item.startTime).toLocaleTimeString();
            const endTime = new Date(item.endTime).toLocaleTimeString();
            const duration = (item.duration / 3600).toFixed(2);
            
            csvContent += `${date},${startTime},${endTime},${duration},${item.quality},${item.movements || 0}\n`;
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'wakewell_sleep_data.csv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toastManager.success('CSV exported successfully');
    }

    exportPDF(data) {
        // In a real app, this would generate a PDF
        // For now, just show a message
        toastManager.info('PDF export not implemented in this demo');
    }
}

// Initialize reports page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        toastManager.error('Could not load Chart.js library');
        return;
    }
    
    window.reportsPage = new ReportsPage();
});