// Tag Correlation Analysis Component
export class TagCorrelation {
    constructor(tagEngine) {
        this.tagEngine = tagEngine;
    }

    analyzeCorrelations(sleepData) {
        const correlations = {};
        const tags = this.tagEngine.getUserTags();

        tags.forEach(tag => {
            const entriesWithTag = sleepData.filter(entry => 
                entry.tags && entry.tags.some(t => t.id === tag.id)
            );

            if (entriesWithTag.length === 0) return;

            const avgQualityWithTag = this.calculateAverage(entriesWithTag, 'quality');
            const avgDurationWithTag = this.calculateAverage(entriesWithTag, 'duration');

            const entriesWithoutTag = sleepData.filter(entry => 
                !entry.tags || !entry.tags.some(t => t.id === tag.id)
            );

            const avgQualityWithoutTag = this.calculateAverage(entriesWithoutTag, 'quality');
            const avgDurationWithoutTag = this.calculateAverage(entriesWithoutTag, 'duration');

            correlations[tag.id] = {
                tag,
                frequency: (entriesWithTag.length / sleepData.length) * 100,
                qualityDiff: avgQualityWithTag - avgQualityWithoutTag,
                durationDiff: avgDurationWithTag - avgDurationWithoutTag,
                sampleSize: entriesWithTag.length
            };
        });

        return correlations;
    }

    calculateAverage(entries, property) {
        if (entries.length === 0) return 0;
        return entries.reduce((sum, entry) => sum + entry[property], 0) / entries.length;
    }

    generateInsights(correlations) {
        const insights = [];

        Object.values(correlations).forEach(correlation => {
            if (correlation.sampleSize < 3) return; // Ignore tags with too few samples

            const qualityImpact = this.getImpactDescription(correlation.qualityDiff);
            const durationImpact = this.getImpactDescription(correlation.durationDiff, true);

            insights.push({
                tag: correlation.tag,
                frequency: Math.round(correlation.frequency),
                qualityImpact,
                durationImpact,
                significance: this.calculateSignificance(correlation)
            });
        });

        return insights.sort((a, b) => b.significance - a.significance);
    }

    getImpactDescription(diff, isDuration = false) {
        const threshold = isDuration ? 0.5 : 5; // 30 mins for duration, 5% for quality
        const impact = {
            value: Math.abs(diff),
            direction: diff > 0 ? 'higher' : 'lower',
            significant: Math.abs(diff) > threshold
        };

        if (!impact.significant) return null;

        if (isDuration) {
            const hours = Math.floor(impact.value);
            const minutes = Math.round((impact.value - hours) * 60);
            return {
                text: `${hours}h ${minutes}m ${impact.direction}`,
                positive: diff > 0
            };
        }

        return {
            text: `${Math.round(impact.value)}% ${impact.direction}`,
            positive: diff > 0
        };
    }

    calculateSignificance(correlation) {
        // Combine frequency and impact magnitude for ranking
        const qualityImpact = Math.abs(correlation.qualityDiff);
        const durationImpact = Math.abs(correlation.durationDiff) * 10; // Weight duration more heavily
        return (correlation.frequency * (qualityImpact + durationImpact)) / 100;
    }

    renderInsights(insights) {
        const container = document.createElement('div');
        container.className = 'tag-correlation-insights';

        insights.forEach(insight => {
            const card = document.createElement('div');
            card.className = 'correlation-card';
            
            let impactText = '';
            if (insight.qualityImpact) {
                impactText += `<div class="impact-item ${insight.qualityImpact.positive ? 'positive' : 'negative'}">
                    Sleep quality is ${insight.qualityImpact.text}
                </div>`;
            }
            if (insight.durationImpact) {
                impactText += `<div class="impact-item ${insight.durationImpact.positive ? 'positive' : 'negative'}">
                    Sleep duration is ${insight.durationImpact.text}
                </div>`;
            }

            card.innerHTML = `
                <div class="correlation-header">
                    <span class="tag-emoji">${insight.tag.emoji}</span>
                    <span class="tag-name">${insight.tag.name}</span>
                    <span class="tag-frequency">${insight.frequency}% of nights</span>
                </div>
                <div class="correlation-impacts">
                    ${impactText}
                </div>
            `;

            container.appendChild(card);
        });

        return container;
    }
}
