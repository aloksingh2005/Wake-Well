// Custom Events Manager
export const EventTypes = {
    SLEEP_DATA_UPDATED: 'sleepDataUpdated',
    SLEEP_STREAK_UPDATED: 'sleepStreakUpdated',
    SLEEP_HISTORY_UPDATED: 'sleepHistoryUpdated',
    SLEEP_PHASE_CHANGE: 'sleepPhaseChange'
};

export function dispatchSleepDataUpdate(sleepData) {
    document.dispatchEvent(new CustomEvent(EventTypes.SLEEP_DATA_UPDATED, {
        detail: { sleepData }
    }));
}

export function dispatchStreakUpdate(streakData) {
    document.dispatchEvent(new CustomEvent(EventTypes.SLEEP_STREAK_UPDATED, {
        detail: { streakData }
    }));
}

export function dispatchHistoryUpdate(history) {
    document.dispatchEvent(new CustomEvent(EventTypes.SLEEP_HISTORY_UPDATED, {
        detail: { history }
    }));
}

export function dispatchPhaseChange(phase, timestamp, duration) {
    document.dispatchEvent(new CustomEvent(EventTypes.SLEEP_PHASE_CHANGE, {
        detail: { phase, timestamp, duration }
    }));
}
