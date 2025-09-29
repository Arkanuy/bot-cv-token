class BackgroundUpdater {
    constructor() {
        this.updateIntervals = new Map();
        this.isRunning = new Map();
    }

    startRealTimeUpdates(sessionId, updateCallback, stats, interval = 2000) {
        if (this.isRunning.get(sessionId)) {
            return;
        }

        console.log(`🔄 Starting real-time updates for session: ${sessionId}`);
        this.isRunning.set(sessionId, true);

        const intervalId = setInterval(async () => {
            if (!this.isRunning.get(sessionId)) {
                clearInterval(intervalId);
                this.updateIntervals.delete(sessionId);
                return;
            }

            try {
                await updateCallback(stats);
            } catch (error) {
                console.log(`⚠️ Background update error for ${sessionId}:`, error.message);
            }
        }, interval);

        this.updateIntervals.set(sessionId, intervalId);
    }

    stopRealTimeUpdates(sessionId) {
        console.log(`🛑 Stopping real-time updates for session: ${sessionId}`);
        this.isRunning.set(sessionId, false);
        
        const intervalId = this.updateIntervals.get(sessionId);
        if (intervalId) {
            clearInterval(intervalId);
            this.updateIntervals.delete(sessionId);
        }
    }

    updateStats(sessionId, newStats) {
        // Stats akan diupdate di memory reference yang sama
    }

    isSessionActive(sessionId) {
        return this.isRunning.get(sessionId) || false;
    }
}

module.exports = new BackgroundUpdater();