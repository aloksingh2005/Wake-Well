// Sleep Streak Tracker Component
export class SleepStreak {
    constructor() {
        this.streakData = {
            currentStreak: 0,
            longestStreak: 0,
            weeklyGoal: 5,
            weeklyProgress: 0,
            lastUpdate: null
        };
        this.loadStreakData();
    }

    loadStreakData() {
        const saved = localStorage.getItem('sleepStreak');
        if (saved) {
            this.streakData = JSON.parse(saved);
        }
    }

    saveStreakData() {
        localStorage.setItem('sleepStreak', JSON.stringify(this.streakData));
    }

    updateStreak(sleepData) {
        const today = new Date();
        const yesterdayDate = new Date(today);
        yesterdayDate.setDate(today.getDate() - 1);

        // Check if this is a quality sleep night (duration >= 7 hours and quality >= 70)
        const isQualitySleep = sleepData.duration >= 7 && sleepData.quality >= 70;

        // If this is yesterday's sleep (most common case when logging sleep)
        if (this.isSameDay(new Date(sleepData.date), yesterdayDate)) {
            if (isQualitySleep) {
                this.streakData.currentStreak++;
                this.streakData.longestStreak = Math.max(
                    this.streakData.longestStreak,
                    this.streakData.currentStreak
                );
            } else {
                this.streakData.currentStreak = 0;
            }
        }
        // If streak was broken (missed a day)
        else if (new Date(sleepData.date) < yesterdayDate) {
            this.streakData.currentStreak = isQualitySleep ? 1 : 0;
        }

        this.updateWeeklyProgress();
        this.saveStreakData();
        this.updateUI();
    }

    updateWeeklyProgress() {
        const sleepHistory = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
        const lastWeek = sleepHistory.filter(entry => {
            const entryDate = new Date(entry.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return entryDate >= weekAgo;
        });

        const qualityNights = lastWeek.filter(
            entry => entry.duration >= 7 && entry.quality >= 70
        ).length;

        this.streakData.weeklyProgress = qualityNights;
    }

    getWeekDays() {
        const days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            days.push({
                date: date,
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                isToday: i === 0
            });
        }
        
        return days;
    }

    updateUI() {
        // Update streak badge
        const streakBadge = document.getElementById('streakBadge');
        if (streakBadge) {
            streakBadge.querySelector('.streak-count').textContent = 
                this.streakData.currentStreak;
        }

        // Update progress bar
        const progressPercent = (this.streakData.weeklyProgress / this.streakData.weeklyGoal) * 100;
        const progressText = document.querySelector('.progress-percent');
        const progressFill = document.querySelector('.progress-fill');
        
        if (progressText && progressFill) {
            progressText.textContent = `${Math.round(progressPercent)}%`;
            progressFill.style.width = `${Math.min(progressPercent, 100)}%`;
        }

        // Update streak days
        const streakDays = document.getElementById('streakDays');
        if (streakDays) {
            streakDays.innerHTML = '';
            
            this.getWeekDays().forEach(day => {
                const dayEl = document.createElement('div');
                dayEl.className = `streak-day${
                    day.isToday ? ' today' : ''
                }`;
                
                // Find sleep data for this day
                const sleepHistory = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
                const dayData = sleepHistory.find(entry => 
                    this.isSameDay(new Date(entry.date), day.date)
                );
                
                if (dayData && dayData.duration >= 7 && dayData.quality >= 70) {
                    dayEl.classList.add('completed');
                }
                
                dayEl.innerHTML = `
                    <span class="day-label">${day.label}</span>
                    ${dayData ? `<span class="day-score">${Math.round(dayData.quality)}</span>` : ''}
                `;
                
                streakDays.appendChild(dayEl);
            });
        }
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
}
