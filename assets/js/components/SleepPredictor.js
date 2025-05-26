// Sleep Predictor Component
import { TagEngine } from './TagEngine.js';
import { EventTypes } from '../utils/events.js';

export class SleepPredictor {
    constructor() {
        this.tagEngine = new TagEngine();
        this.predictionCache = new Map();
        this.minDataPoints = 5; // Minimum data points needed for prediction
    }

    async analyzePastPatterns(sleepHistory) {
        const patterns = {};
        const tags = this.tagEngine.getUserTags();
        
        // Analyze each tag's impact
        tags.forEach(tag => {
            const entriesWithTag = sleepHistory.filter(entry => 
                entry.tags && entry.tags.some(t => t.id === tag.id)
            );

            if (entriesWithTag.length >= this.minDataPoints) {
                patterns[tag.id] = {
                    tag,
                    avgQuality: this.calculateAverage(entriesWithTag, 'quality'),
                    avgDuration: this.calculateAverage(entriesWithTag, 'duration'),
                    consistency: this.calculateConsistency(entriesWithTag),
                    frequency: entriesWithTag.length / sleepHistory.length,
                    timeOfDay: this.analyzeTimePatterns(entriesWithTag)
                };
            }
        });

        return patterns;
    }

    /**
     * Analyzes combinations of tags to find synergistic effects
     */
    analyzeCombinations(sleepHistory) {
        const combinations = new Map();
        
        sleepHistory.forEach(entry => {
            if (!entry.tags || entry.tags.length < 2) return;
            
            // Look at pairs of tags
            for (let i = 0; i < entry.tags.length; i++) {
                for (let j = i + 1; j < entry.tags.length; j++) {
                    const key = [entry.tags[i].id, entry.tags[j].id].sort().join('-');
                    
                    if (!combinations.has(key)) {
                        combinations.set(key, {
                            tags: [entry.tags[i], entry.tags[j]],
                            entries: [],
                            synergy: 0
                        });
                    }
                    
                    combinations.get(key).entries.push(entry);
                }
            }
        });

        // Calculate synergy scores
        combinations.forEach((data, key) => {
            if (data.entries.length < this.minDataPoints) {
                combinations.delete(key);
                return;
            }

            const avgQualityTogether = this.calculateAverage(data.entries, 'quality');
            
            // Get individual tag averages
            const tag1Entries = sleepHistory.filter(e => 
                e.tags && e.tags.some(t => t.id === data.tags[0].id)
            );
            const tag2Entries = sleepHistory.filter(e => 
                e.tags && e.tags.some(t => t.id === data.tags[1].id)
            );
            
            const avgQuality1 = this.calculateAverage(tag1Entries, 'quality');
            const avgQuality2 = this.calculateAverage(tag2Entries, 'quality');
            
            // Synergy is the difference between combined effect and average individual effects
            data.synergy = avgQualityTogether - (avgQuality1 + avgQuality2) / 2;
        });

        return combinations;
    }

    /**
     * Analyzes weekly patterns in sleep quality
     */
    analyzeWeeklyPatterns(sleepHistory) {
        const weeklyPatterns = Array(7).fill(0).map(() => ({
            quality: 0,
            duration: 0,
            count: 0
        }));

        sleepHistory.forEach(entry => {
            const day = new Date(entry.startTime).getDay();
            weeklyPatterns[day].quality += entry.quality || 0;
            weeklyPatterns[day].duration += entry.duration || 0;
            weeklyPatterns[day].count++;
        });

        // Calculate averages
        return weeklyPatterns.map(pattern => ({
            quality: pattern.count ? pattern.quality / pattern.count : null,
            duration: pattern.count ? pattern.duration / pattern.count : null,
            count: pattern.count
        }));
    }

    predictSleepQuality(selectedTags, currentTime = new Date()) {
        const cacheKey = selectedTags.map(t => t.id).join(',');
        if (this.predictionCache.has(cacheKey)) {
            return this.predictionCache.get(cacheKey);
        }

        const sleepHistory = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
        const patterns = this.analyzePastPatterns(sleepHistory);
        const combinations = this.analyzeCombinations(sleepHistory);
        const weeklyPatterns = this.analyzeWeeklyPatterns(sleepHistory);

        let prediction = {
            expectedQuality: 75,
            expectedDuration: 7,
            confidence: 0.5,
            insights: [],
            tips: [],
            weekdayImpact: 0
        };

        // Analyze impact of each selected tag
        selectedTags.forEach(tag => {
            if (patterns[tag.id]) {
                const pattern = patterns[tag.id];
                
                prediction.expectedQuality = 
                    (prediction.expectedQuality + pattern.avgQuality) / 2;
                prediction.expectedDuration = 
                    (prediction.expectedDuration + pattern.avgDuration) / 2;
                prediction.confidence = 
                    (prediction.confidence + pattern.consistency) / 2;
                
                this.addTagInsights(prediction, pattern, currentTime);
            }
        });

        // Analyze tag combinations
        if (selectedTags.length >= 2) {
            for (let i = 0; i < selectedTags.length; i++) {
                for (let j = i + 1; j < selectedTags.length; j++) {
                    const key = [selectedTags[i].id, selectedTags[j].id].sort().join('-');
                    const combo = combinations.get(key);
                    
                    if (combo && Math.abs(combo.synergy) > 5) {
                        prediction.insights.push({
                            type: combo.synergy > 0 ? 'positive' : 'warning',
                            icon: combo.synergy > 0 ? '✨' : '⚠️',
                            text: `"${combo.tags[0].name}" and "${combo.tags[1].name}" ${
                                combo.synergy > 0 ? 'work well together' : 'might conflict'
                            } (${Math.abs(Math.round(combo.synergy))}% impact)`
                        });
                        
                        prediction.expectedQuality += combo.synergy / 2;
                    }
                }
            }
        }

        // Add weekday impact
        const dayOfWeek = currentTime.getDay();
        const dayPattern = weeklyPatterns[dayOfWeek];
        if (dayPattern.quality) {
            const baselineQuality = this.calculateAverage(sleepHistory, 'quality');
            prediction.weekdayImpact = dayPattern.quality - baselineQuality;
            
            if (Math.abs(prediction.weekdayImpact) > 5) {
                prediction.insights.push({
                    type: 'info',
                    icon: '📅',
                    text: `Your sleep is typically ${
                        prediction.weekdayImpact > 0 ? 'better' : 'worse'
                    } on ${new Date(0,0,dayOfWeek).toLocaleDateString('en-US', {weekday: 'long'})}s`
                });
            }
            
            prediction.expectedQuality += prediction.weekdayImpact / 2;
        }

        // Add general tips
        this.addGeneralTips(prediction);

        // Round the final quality prediction
        prediction.expectedQuality = Math.round(prediction.expectedQuality);

        // Cache prediction
        this.predictionCache.set(cacheKey, prediction);
        
        return prediction;
    }

    addTagInsights(prediction, pattern, currentTime) {
        const { tag, avgQuality, avgDuration, timeOfDay } = pattern;

        // Quality insights
        if (avgQuality < 70) {
            prediction.insights.push({
                type: 'warning',
                icon: '⚠️',
                text: `Nights with "${tag.name}" typically have ${Math.round(avgQuality)}% quality`
            });
        }

        // Duration insights
        if (avgDuration < 7) {
            prediction.insights.push({
                type: 'info',
                icon: '⏰',
                text: `You usually sleep ${this.formatDuration(avgDuration)} with "${tag.name}"`
            });
        }

        // Time-based insights
        if (timeOfDay.bedtime) {
            const optimalBedtime = new Date(timeOfDay.bedtime);
            const currentHour = currentTime.getHours();
            
            if (Math.abs(currentHour - optimalBedtime.getHours()) > 2) {
                prediction.insights.push({
                    type: 'tip',
                    icon: '🌙',
                    text: `Try going to bed around ${optimalBedtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} for better sleep`
                });
            }
        }
    }

    addGeneralTips(prediction) {
        if (prediction.expectedQuality < 70) {
            prediction.tips.push({
                icon: '💡',
                text: 'Consider meditation or relaxation exercises before bed'
            });
        }

        if (prediction.expectedDuration < 7) {
            prediction.tips.push({
                icon: '⏰',
                text: 'Aim to get at least 7 hours of sleep for optimal rest'
            });
        }

        // Add time-sensitive tips
        const hour = new Date().getHours();
        if (hour >= 20) {
            prediction.tips.push({
                icon: '📱',
                text: 'Avoid screen time in the next hour for better sleep quality'
            });
        }
    }

    calculateAverage(entries, property) {
        return entries.reduce((sum, entry) => sum + entry[property], 0) / entries.length;
    }

    calculateConsistency(entries) {
        if (entries.length < 2) return 0;

        const durations = entries.map(e => e.duration);
        const variance = this.calculateVariance(durations);
        return Math.max(0, 1 - (variance / 4)); // Normalize to 0-1
    }

    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }

    analyzeTimePatterns(entries) {
        const bedtimes = entries.map(e => new Date(e.startTime));
        const waketimes = entries.map(e => new Date(e.endTime));

        return {
            bedtime: this.findMostCommonTime(bedtimes),
            waketime: this.findMostCommonTime(waketimes)
        };
    }

    findMostCommonTime(timestamps) {
        if (timestamps.length === 0) return null;

        // Group times by hour
        const hourCounts = timestamps.reduce((counts, time) => {
            const hour = time.getHours();
            counts[hour] = (counts[hour] || 0) + 1;
            return counts;
        }, {});

        // Find most common hour
        const mostCommonHour = Object.entries(hourCounts)
            .sort(([, a], [, b]) => b - a)[0][0];

        // Create a date object with the most common hour
        const result = new Date();
        result.setHours(mostCommonHour, 0, 0, 0);
        return result;
    }

    formatDuration(hours) {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    }
}
