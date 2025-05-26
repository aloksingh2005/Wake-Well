// Smart Tag Engine
export class TagEngine {
    constructor() {
        this.tagRules = [
            {
                id: 'late-night',
                name: 'Late Night',
                emoji: '⏰',
                condition: (sleepData) => sleepData.duration < 5,
                explanation: 'Sleep duration was less than 5 hours'
            },
            {
                id: 'restless',
                name: 'Restless',
                emoji: '🌪️',
                condition: (sleepData) => sleepData.motionIntensity > 0.7,
                explanation: 'Higher than usual movement detected during sleep'
            },
            {
                id: 'disrupted',
                name: 'Disrupted',
                emoji: '🔊',
                condition: (sleepData) => sleepData.noiseLevel > 0.6,
                explanation: 'Significant noise levels detected during sleep'
            },
            {
                id: 'routine',
                name: 'Routine',
                emoji: '📅',
                condition: (sleepData, history) => this.checkRoutinePattern(sleepData, history),
                explanation: 'Consistent sleep-wake pattern detected'
            },
            {
                id: 'refreshed',
                name: 'Refreshed',
                emoji: '🌙',
                condition: (sleepData) => sleepData.duration >= 7 && sleepData.quality >= 85,
                explanation: 'Optimal sleep duration and quality achieved'
            },
            {
                id: 'deep-sleep',
                name: 'Deep Sleep',
                emoji: '💫',
                condition: (sleepData) => sleepData.phases.deep > 0.3,
                explanation: 'Higher than average deep sleep percentage'
            }
        ];
    }

    analyzeSleepData(sleepData, history = []) {
        const suggestions = [];
        
        for (const rule of this.tagRules) {
            try {
                if (rule.condition(sleepData, history)) {
                    suggestions.push({
                        id: rule.id,
                        name: rule.name,
                        emoji: rule.emoji,
                        explanation: rule.explanation
                    });
                }
            } catch (error) {
                console.error(`Error evaluating rule ${rule.name}:`, error);
            }
        }
        
        return suggestions;
    }

    checkRoutinePattern(currentSleep, history) {
        if (history.length < 5) return false;

        const recentWakeups = history.slice(-5).map(entry => {
            const wakeTime = new Date(entry.endTime);
            return wakeTime.getHours() * 60 + wakeTime.getMinutes();
        });

        const currentWakeTime = new Date(currentSleep.endTime);
        const currentMinutes = currentWakeTime.getHours() * 60 + currentWakeTime.getMinutes();

        // Check if wake times are within 30 minutes of each other
        return recentWakeups.every(time => 
            Math.abs(time - currentMinutes) <= 30
        );
    }

    getUserTags() {
        return JSON.parse(localStorage.getItem('userTags') || '[]');
    }

    saveUserTag(tag) {
        const userTags = this.getUserTags();
        if (!userTags.some(t => t.id === tag.id)) {
            userTags.push(tag);
            localStorage.setItem('userTags', JSON.stringify(userTags));
        }
    }

    getTagStats(history) {
        const stats = {};
        history.forEach(entry => {
            if (entry.tags) {
                entry.tags.forEach(tag => {
                    stats[tag.id] = (stats[tag.id] || 0) + 1;
                });
            }
        });
        return stats;
    }
}
