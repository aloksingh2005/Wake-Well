// Reports Page JavaScript

import { showToast } from './utils/toast.js';
import { showLoading, hideLoading } from './utils/loading.js';
import { TagFilter } from './components/TagFilter.js';
import { PredictionPreview } from './components/PredictionPreview.js';

// DOM Elements
const elements = {
    rangeBtns: document.querySelectorAll('.range-btn'),
    avgDuration: document.getElementById('avgDuration'),
    avgQuality: document.getElementById('avgQuality'),
    bestSleep: document.getElementById('bestSleep'),
    sleepTrend: document.getElementById('sleepTrend'),
    sleepRecommendation: document.getElementById('sleepRecommendation'),
    goalProgress: document.getElementById('goalProgress'),
    exportPDF: document.getElementById('exportPDF'),
    exportCSV: document.getElementById('exportCSV'),
    durationChart: document.getElementById('durationChart'),
    qualityChart: document.getElementById('qualityChart'),
    predictionPreview: document.getElementById('predictionPreview')
};

// Chart Instances
let durationChartInstance;
let qualityChartInstance;

// Current Time Range
let currentRange = 'week';

class SleepReports {
    constructor() {
        this.charts = {};
        this.currentRange = 'week';
        this.sleepData = [];
        this.journalData = [];
        this.tagFilter = new TagFilter();
        this.predictionPreview = new PredictionPreview();
        
        // Initialize
        this.initialize();
    }

    async initialize() {
        await this.loadData();
        this.setupEventListeners();
        this.createCharts();
        this.initializeCalendar();
        this.createWakePatternClock();
        this.generateInsights();
        
        // Initialize components
        const filterContainer = document.querySelector('.tag-filter-section');
        this.tagFilter.initialize(filterContainer, this.charts);
        this.predictionPreview.initialize(elements.predictionPreview);
    }

    async loadData() {
        try {
            showLoading('Loading your sleep data...');
            
            // Load sleep and journal data
            this.sleepData = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
            this.journalData = JSON.parse(localStorage.getItem('sleepJournal') || '[]');

            // Process and combine data
            this.processedData = this.combineData();
            
            // Update quick stats
            this.updateQuickStats();
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Error loading sleep data', 'error');
        } finally {
            hideLoading();
        }
    }

    combineData() {
        // Combine sleep and journal data by date
        const combined = this.sleepData.map(sleep => {
            const date = new Date(sleep.startTime).toISOString().split('T')[0];
            const journal = this.journalData.find(j => j.date.split('T')[0] === date);
            
            return {
                date,
                sleep,
                journal
            };
        });

        return combined.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    updateQuickStats() {
        const recent = this.processedData.slice(-7);
        
        // Average sleep score
        const avgScore = recent.reduce((sum, day) => sum + day.sleep.quality, 0) / recent.length;
        document.getElementById('avgSleepScore').textContent = Math.round(avgScore);

        // Average duration
        const avgDuration = recent.reduce((sum, day) => sum + day.sleep.duration, 0) / recent.length;
        document.getElementById('avgDuration').textContent = this.formatDuration(avgDuration);

        // Average mood
        const moodCounts = recent.reduce((acc, day) => {
            if (day.journal?.mood) {
                acc[day.journal.mood] = (acc[day.journal.mood] || 0) + 1;
            }
            return acc;
        }, {});
        const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
        document.getElementById('avgMood').textContent = topMood ? topMood[0] : '--';

        // Deep sleep percentage
        const avgDeepSleep = recent.reduce((sum, day) => {
            const deepSleepTime = day.sleep.motionData.filter(m => m.intensity < 0.5).length;
            return sum + (deepSleepTime / day.sleep.motionData.length);
        }, 0) / recent.length * 100;
        document.getElementById('deepSleepPercent').textContent = Math.round(avgDeepSleep) + '%';
    }

    setupEventListeners() {
        // Time range buttons
        document.querySelectorAll('.range-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentRange = btn.dataset.range;
                document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateCharts();
            });
        });

        // Export button
        document.getElementById('exportData').addEventListener('click', () => {
            document.getElementById('exportModal').classList.add('active');
        });

        // Export options
        document.querySelectorAll('.export-options button').forEach(btn => {
            btn.addEventListener('click', () => this.exportData(btn.dataset.format));
        });

        // Close modal
        document.querySelector('.modal-close').addEventListener('click', () => {
            document.getElementById('exportModal').classList.remove('active');
        });

        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateCalendar();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateCalendar();
        });
    }

    createCharts() {
        const ctx = {
            duration: elements.durationChart.getContext('2d'),
            quality: elements.qualityChart.getContext('2d'),
            phases: document.getElementById('phasesChart').getContext('2d'),
            mood: document.getElementById('moodCorrelationChart').getContext('2d')
        };

        // Common chart options
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        };

        // Sleep Duration Chart
        this.charts.duration = new Chart(ctx.duration, {
            type: 'line',
            data: this.getDurationChartData(),
            options: {
                ...commonOptions,
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

        // Sleep Quality Chart
        this.charts.quality = new Chart(ctx.quality, {
            type: 'bar',
            data: this.getQualityChartData(),
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Quality Score (%)'
                        }
                    }
                }
            }
        });

        // Sleep Phases Chart
        this.charts.phases = new Chart(ctx.phases, {
            type: 'doughnut',
            data: this.getPhasesChartData(),
            options: {
                ...commonOptions,
                cutout: '70%'
            }
        });

        // Mood Correlation Chart
        this.charts.mood = new Chart(ctx.mood, {
            type: 'scatter',
            data: this.getMoodCorrelationData(),
            options: {
                ...commonOptions,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Sleep Duration (hours)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Mood Score'
                        }
                    }
                }
            }
        });
    }

    getDurationChartData() {
        const dates = this.getDateRange();
        const sleepData = this.filterDataByRange(this.sleepData);

        return {
            labels: dates.map(date => date.toLocaleDateString()),
            datasets: [{
                label: 'Sleep Duration',
                data: sleepData.map(entry => entry.duration),
                borderColor: '#4299e1',
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
    }

    getQualityChartData() {
        const dates = this.getDateRange();
        const sleepData = this.filterDataByRange(this.sleepData);

        return {
            labels: dates.map(date => date.toLocaleDateString()),
            datasets: [{
                label: 'Sleep Quality',
                data: sleepData.map(entry => entry.quality),
                backgroundColor: '#48bb78',
                borderColor: '#38a169',
                borderWidth: 1
            }]
        };
    }

    getPhasesChartData() {
        const sleepData = this.filterDataByRange(this.sleepData);
        const phases = ['Deep', 'Light', 'REM'];
        const phaseData = this.calculateAveragePhases(sleepData);

        return {
            labels: phases,
            datasets: [{
                data: phases.map(phase => phaseData[phase.toLowerCase()]),
                backgroundColor: ['#4299e1', '#48bb78', '#9f7aea'],
                borderWidth: 0
            }]
        };
    }

    getMoodCorrelationData() {
        const sleepData = this.filterDataByRange(this.sleepData);
        return {
            datasets: [{
                label: 'Sleep vs Mood',
                data: sleepData.map(entry => ({
                    x: entry.duration,
                    y: entry.moodScore
                })),
                backgroundColor: '#ed64a6',
                borderColor: '#d53f8c'
            }]
        };
    }

    generateInsights() {
        const insights = this.analyzeData();
        const container = document.getElementById('sleepInsights');
        container.innerHTML = '';

        insights.forEach(insight => {
            const card = document.createElement('div');
            card.className = 'insight-card';
            card.innerHTML = `
                <span class="insight-icon">${insight.icon}</span>
                <div class="insight-content">
                    <h3>${insight.title}</h3>
                    <p>${insight.description}</p>
                </div>
            `;
            container.appendChild(card);
        });
    }

    analyzeData() {
        const sleepData = this.filterDataByRange(this.sleepData);
        const insights = [];

        // Average sleep duration trend
        const avgDuration = this.calculateAverageDuration(sleepData);
        insights.push({
            icon: '⏰',
            title: 'Sleep Duration',
            description: `Your average sleep duration is ${avgDuration.toFixed(1)} hours. ${
                avgDuration < 7 ? 'Try to get at least 7 hours of sleep for better health.' : 'Great job maintaining healthy sleep duration!'
            }`
        });

        // Sleep quality analysis
        const avgQuality = this.calculateAverageQuality(sleepData);
        insights.push({
            icon: '⭐',
            title: 'Sleep Quality',
            description: `Your average sleep quality is ${avgQuality.toFixed(0)}%. ${
                this.getQualityInsight(avgQuality)
            }`
        });

        // Sleep schedule consistency
        const consistency = this.calculateScheduleConsistency(sleepData);
        insights.push({
            icon: '📊',
            title: 'Sleep Schedule',
            description: `Your sleep schedule is ${consistency}% consistent. ${
                consistency < 70 ? 'Try to maintain a more regular sleep schedule.' : 'Keep up the consistent sleep schedule!'
            }`
        });

        return insights;
    }

    // Helper methods
    calculateAverageDuration(data) {
        return data.reduce((sum, entry) => sum + entry.duration, 0) / data.length;
    }

    calculateAverageQuality(data) {
        return data.reduce((sum, entry) => sum + entry.quality, 0) / data.length;
    }

    calculateScheduleConsistency(data) {
        // Calculate the variance in sleep start times
        const times = data.map(entry => new Date(entry.startTime).getHours());
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
        // Convert variance to a 0-100 consistency score
        return Math.max(0, 100 - (variance * 10));
    }

    getQualityInsight(quality) {
        if (quality >= 90) return 'Excellent sleep quality!';
        if (quality >= 70) return 'Good sleep quality. Keep it up!';
        return 'There might be room for improvement in your sleep quality.';
    }

    calculateAveragePhases(data) {
        const totals = { deep: 0, light: 0, rem: 0 };
        data.forEach(entry => {
            totals.deep += entry.phases.deep || 0;
            totals.light += entry.phases.light || 0;
            totals.rem += entry.phases.rem || 0;
        });
        return {
            deep: totals.deep / data.length,
            light: totals.light / data.length,
            rem: totals.rem / data.length
        };
    }

    getDateRangeData() {
        const now = new Date();
        let startDate = new Date();
        
        switch (this.currentRange) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }
        
        return this.processedData.filter(d => new Date(d.date) >= startDate);
    }

    updateCharts() {
        this.charts.sleepMood.data = this.getSleepMoodData();
        this.charts.sleepMood.update();

        this.charts.sleepTrend.data = this.getSleepTrendData();
        this.charts.sleepTrend.update();

        this.charts.phases.data = this.getSleepPhasesData();
        this.charts.phases.update();

        this.createMoodCalendar();
    }

    async exportData(format) {
        showLoading('Preparing export...');
        
        try {
            switch (format) {
                case 'pdf':
                    await this.exportPDF();
                    break;
                case 'csv':
                    this.exportCSV();
                    break;
                case 'json':
                    this.exportJSON();
                    break;
            }
            
            showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Failed to export data', 'error');
        } finally {
            hideLoading();
            document.getElementById('exportModal').classList.remove('active');
        }
    }

    formatDuration(hours) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    }

    generateColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (i * 137.508) % 360; // Golden angle approximation
            colors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
        }
        return colors;
    }

    initializeCalendar() {
        this.currentDate = new Date();
        this.updateCalendar();
        
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateCalendar();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateCalendar();
        });
    }

    updateCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month display
        document.getElementById('currentMonth').textContent = 
            new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';
        
        // Empty cells for days before the first of the month
        for (let i = 0; i < startDay; i++) {
            this.createCalendarDay('');
        }
        
        // Days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const sleepData = this.getSleepDataForDate(date);
            this.createCalendarDay(day, sleepData);
        }
    }

    createCalendarDay(dayNumber, sleepData = null) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day' + (dayNumber ? '' : ' empty');
        
        if (dayNumber) {
            const scoreClass = sleepData ? this.getSleepScoreClass(sleepData.quality) : '';
            dayEl.innerHTML = `
                <span class="day-number">${dayNumber}</span>
                ${sleepData ? `<span class="score-dot ${scoreClass}"></span>` : ''}
            `;
            
            if (sleepData) {
                dayEl.addEventListener('click', () => this.showDayDetail(sleepData));
            }
        }
        
        document.getElementById('calendarDays').appendChild(dayEl);
    }

    getSleepScoreClass(quality) {
        if (quality >= 90) return 'excellent';
        if (quality >= 70) return 'good';
        if (quality >= 50) return 'fair';
        return 'poor';
    }

    showDayDetail(sleepData) {
        const modal = document.createElement('div');
        modal.className = 'day-detail-modal';
        modal.innerHTML = `
            <h3>${new Date(sleepData.date).toLocaleDateString()}</h3>
            <div class="sleep-details">
                <p>Duration: ${sleepData.duration.toFixed(1)} hours</p>
                <p>Quality: ${sleepData.quality}%</p>
                <p>Bedtime: ${new Date(sleepData.startTime).toLocaleTimeString()}</p>
                <p>Wake time: ${new Date(sleepData.endTime).toLocaleTimeString()}</p>
                ${sleepData.notes ? `<p>Notes: ${sleepData.notes}</p>` : ''}
            </div>
        `;
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.addEventListener('click', () => {
            modal.remove();
            overlay.remove();
        });
        
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
    }

    createWakePatternClock() {
        const ctx = document.getElementById('wakePatternClock').getContext('2d');
        
        // Get last 7 days of sleep data
        const recentData = this.sleepData.slice(-7);
        
        new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: Array.from({length: 24}, (_, i) => i),
                datasets: [{
                    data: this.generateHourlyData(recentData),
                    backgroundColor: this.generateHourlyColors(recentData),
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.1)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            display: false
                        },
                        grid: {
                            circular: true
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const hour = context.label;
                                const value = context.raw;
                                return `${hour}:00 - ${value}% active`;
                            }
                        }
                    }
                }
            }
        });
    }

    generateHourlyData(sleepData) {
        const hourlyActivity = Array(24).fill(0);
        
        sleepData.forEach(entry => {
            const start = new Date(entry.startTime);
            const end = new Date(entry.endTime);
            
            let current = new Date(start);
            while (current < end) {
                hourlyActivity[current.getHours()]++;
                current.setHours(current.getHours() + 1);
            }
        });
        
        // Convert to percentages
        const maxActivity = Math.max(...hourlyActivity);
        return hourlyActivity.map(count => (count / maxActivity) * 100);
    }

    generateHourlyColors(sleepData) {
        const hourlyActivity = this.generateHourlyData(sleepData);
        return hourlyActivity.map(activity => 
            activity > 50 ? 'rgba(66, 153, 225, 0.6)' : 'rgba(72, 187, 120, 0.6)'
        );
    }
}

// Initialize reports
document.addEventListener('DOMContentLoaded', () => {
    const reports = new SleepReports();
});