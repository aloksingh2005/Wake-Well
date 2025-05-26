// Tag Suggestions Component
import { TagEngine } from './TagEngine.js';
import { EventTypes } from '../utils/events.js';
import { showToast } from '../utils/toast.js';

export class TagSuggestions {
    constructor() {
        this.tagEngine = new TagEngine();
        this.container = null;
        this.currentSuggestions = [];
    }

    createUI(container) {
        this.container = container;
        
        const suggestionsEl = document.createElement('div');
        suggestionsEl.className = 'tag-suggestions';
        suggestionsEl.innerHTML = `
            <div class="suggestions-header">
                <h3>Smart Tag Suggestions</h3>
                <div class="suggestion-actions">
                    <button class="btn btn-primary" id="applyAllTags">Apply All</button>
                    <button class="btn btn-secondary" id="ignoreTags">Ignore</button>
                </div>
            </div>
            <div class="suggestions-list" id="suggestionsList">
                <!-- Tags will be dynamically added here -->
            </div>
        `;
        
        this.container.appendChild(suggestionsEl);
        this.bindEvents();
    }

    showSuggestions(sleepData, history) {
        this.currentSuggestions = this.tagEngine.analyzeSleepData(sleepData, history);
        
        if (this.currentSuggestions.length === 0) {
            this.container.style.display = 'none';
            return;
        }

        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '';
        
        this.currentSuggestions.forEach(suggestion => {
            const tagEl = document.createElement('div');
            tagEl.className = 'tag-suggestion';
            tagEl.innerHTML = `
                <div class="tag-content">
                    <span class="tag-emoji">${suggestion.emoji}</span>
                    <span class="tag-name">${suggestion.name}</span>
                </div>
                <div class="tag-explanation">
                    <span class="explanation-icon">💡</span>
                    ${suggestion.explanation}
                </div>
                <button class="apply-tag-btn" data-tag-id="${suggestion.id}">
                    Add Tag
                </button>
            `;
            suggestionsList.appendChild(tagEl);

            // Add sparkle animation
            this.addSparkleEffect(tagEl);
        });

        this.container.style.display = 'block';
    }

    bindEvents() {
        const applyAllBtn = document.getElementById('applyAllTags');
        const ignoreBtn = document.getElementById('ignoreTags');
        
        applyAllBtn.addEventListener('click', () => {
            this.applyAllTags();
        });
        
        ignoreBtn.addEventListener('click', () => {
            this.ignoreSuggestions();
        });
        
        document.getElementById('suggestionsList').addEventListener('click', (e) => {
            if (e.target.classList.contains('apply-tag-btn')) {
                const tagId = e.target.dataset.tagId;
                const suggestion = this.currentSuggestions.find(s => s.id === tagId);
                if (suggestion) {
                    this.applyTag(suggestion);
                }
            }
        });
    }

    applyTag(tag) {
        this.tagEngine.saveUserTag(tag);
        
        // Dispatch event for tag application
        document.dispatchEvent(new CustomEvent(EventTypes.TAG_APPLIED, {
            detail: { tag }
        }));

        // Show success animation
        this.showTagAppliedEffect(tag);
        
        showToast(`Added tag: ${tag.emoji} ${tag.name}`, 'success');
    }

    applyAllTags() {
        this.currentSuggestions.forEach(tag => {
            this.applyTag(tag);
        });
        
        // Show celebration effect
        this.showCelebrationEffect();
        
        this.container.style.display = 'none';
    }

    ignoreSuggestions() {
        this.container.style.display = 'none';
    }

    addSparkleEffect(element) {
        element.classList.add('sparkle-in');
        element.addEventListener('animationend', () => {
            element.classList.remove('sparkle-in');
        });
    }

    showTagAppliedEffect(tag) {
        const effect = document.createElement('div');
        effect.className = 'tag-applied-effect';
        effect.textContent = `${tag.emoji} ✓`;
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 1000);
    }

    showCelebrationEffect() {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-container';
        
        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.setProperty('--delay', `${Math.random() * 3}s`);
            piece.style.setProperty('--rotation', `${Math.random() * 360}deg`);
            confetti.appendChild(piece);
        }
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
}
