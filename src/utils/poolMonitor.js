import os from 'os';

class PoolMonitor {
    constructor() {
        this.requestCount = 0;
        this.dbCallCount = 0;
        this.requestTimestamps = [];
        this.windowSizeMs = 60000; // 1 minute rolling window
        this.peakRPS = 0;
        this.avgDBCalls = 1;
        this.currentRequests = new Map(); // Track active requests and their DB calls
    }

    // Track incoming request
    trackRequest(requestId) {
        const now = Date.now();
        this.requestTimestamps.push(now);
        this.requestCount++;

        // Initialize tracking for this request
        this.currentRequests.set(requestId, { dbCalls: 0, startTime: now });

        // Clean old timestamps outside the rolling window
        this.cleanOldTimestamps(now);

        // Calculate current RPS
        const currentRPS = this.calculateCurrentRPS(now);

        // Update peak RPS if current is higher
        if (currentRPS > this.peakRPS) {
            this.peakRPS = currentRPS;
        }
    }

    // Track DB call for a specific request
    trackDBCall(requestId) {
        this.dbCallCount++;

        if (this.currentRequests.has(requestId)) {
            this.currentRequests.get(requestId).dbCalls++;
        }
    }

    // Complete request tracking and update averages
    completeRequest(requestId) {
        if (this.currentRequests.has(requestId)) {
            const requestData = this.currentRequests.get(requestId);

            // Update average DB calls (exponential moving average)
            const alpha = 0.1; // Smoothing factor
            this.avgDBCalls = (alpha * requestData.dbCalls) + ((1 - alpha) * this.avgDBCalls);

            this.currentRequests.delete(requestId);
        }
    }

    // Clean timestamps outside the rolling window
    cleanOldTimestamps(now) {
        const cutoff = now - this.windowSizeMs;
        this.requestTimestamps = this.requestTimestamps.filter(ts => ts > cutoff);
    }

    // Calculate current RPS based on rolling window
    calculateCurrentRPS(now) {
        this.cleanOldTimestamps(now);
        const windowSizeSeconds = this.windowSizeMs / 1000;
        return this.requestTimestamps.length / windowSizeSeconds;
    }

    // Get current metrics
    getMetrics() {
        const now = Date.now();
        return {
            peakRPS: Math.ceil(this.peakRPS),
            avgDBCalls: Math.max(1, Math.round(this.avgDBCalls * 10) / 10), // Round to 1 decimal
            currentRPS: Math.ceil(this.calculateCurrentRPS(now)),
            totalRequests: this.requestCount,
            totalDBCalls: this.dbCallCount
        };
    }

    // Calculate optimal pool sizes based on observed metrics
    calculatePoolSizes() {
        const CPU_CORES = os.cpus().length;
        const metrics = this.getMetrics();

        // Use observed peak RPS, with a safety margin of 1.2x
        const adjustedPeakRPS = Math.ceil(metrics.peakRPS * 1.2);

        const maxPoolSize = Math.min(
            CPU_CORES * 5,
            adjustedPeakRPS * metrics.avgDBCalls * 0.2,
            200  // hard ceiling
        );

        const minPoolSize = Math.max(2, Math.round(maxPoolSize * 0.2));

        return {
            maxPoolSize: Math.ceil(maxPoolSize),
            minPoolSize,
            metrics,
            calculation: {
                cpuBased: CPU_CORES * 5,
                trafficBased: Math.ceil(adjustedPeakRPS * metrics.avgDBCalls * 0.2),
                ceiling: 200
            }
        };
    }

    // Reset peak RPS (useful for periodic resets)
    resetPeak() {
        this.peakRPS = this.calculateCurrentRPS(Date.now());
    }
}

// Singleton instance
const poolMonitor = new PoolMonitor();

export default poolMonitor;
