const apiClient = require('../utils/apiClient');
const proxyManager = require('../utils/proxyUtils');

class TokenProcessor {
    constructor() {
        this.isProcessing = false;
        this.shouldStop = false;
    }

    async processAccounts(emails, platform, updateCallback) {
        if (this.isProcessing) {
            throw new Error('Already processing accounts');
        }

        console.log(`\n🔄 Starting token processing...`);
        console.log(`📧 Total accounts: ${emails.length}`);
        console.log(`🖥️ Platform: ${platform}`);
        console.log(`🧵 Max concurrent threads: ${process.env.MAX_THREADS || 100}`);

        this.isProcessing = true;
        this.shouldStop = false;

        const stats = {
            total: emails.length,
            processed: 0,
            success: 0,
            failed: 0,
            notFound: 0,
            retrying: 0,
            startTime: Date.now(),
            avgTime: 0
        };

        const results = [];
        const processingTimes = [];
        const maxConcurrent = parseInt(process.env.MAX_THREADS) || 100;

        try {
            const processEmail = async (email, index) => {
                if (this.shouldStop) {
                    return null;
                }

                const trimmedEmail = email.trim();
                if (!trimmedEmail) return null;

                console.log(`\n[${index+1}/${emails.length}] Processing: ${trimmedEmail}`);

                const proxy = proxyManager.getRandomProxy();
                if (!proxy) {
                    console.log(`❌ No proxy available for ${trimmedEmail}`);
                    return {
                        email: trimmedEmail,
                        success: false,
                        error: 'No proxy available'
                    };
                }

                console.log(`🌐 Using proxy: ${proxy.split(':')[0]}:${proxy.split(':')[1]}`);

                const startTime = Date.now();
                
                try {
                    const result = await apiClient.generateToken(trimmedEmail, proxy, platform);
                    const endTime = Date.now();
                    const processingTime = (endTime - startTime) / 1000;

                    if (result.success) {
                        console.log(`✅ Success! Token generated for ${trimmedEmail} (${processingTime.toFixed(1)}s)`);
                        return {
                            email: trimmedEmail,
                            success: true,
                            token: result.token,
                            processingTime
                        };
                    } else {
                        console.log(`❌ Failed: ${result.error} for ${trimmedEmail} (${processingTime.toFixed(1)}s)`);
                        return {
                            email: trimmedEmail,
                            success: false,
                            error: result.error,
                            processingTime
                        };
                    }
                } catch (error) {
                    const endTime = Date.now();
                    const processingTime = (endTime - startTime) / 1000;

                    console.log(`❌ Exception: ${error.message} for ${trimmedEmail} (${processingTime.toFixed(1)}s)`);
                    return {
                        email: trimmedEmail,
                        success: false,
                        error: error.message,
                        processingTime
                    };
                }
            };

            const processInBatches = async (emails) => {
                let completedCount = 0;
                
                for (let i = 0; i < emails.length; i += maxConcurrent) {
                    if (this.shouldStop) break;

                    const batch = emails.slice(i, i + maxConcurrent);
                    console.log(`\n🔄 Processing batch ${Math.floor(i/maxConcurrent) + 1} (${batch.length} accounts)`);
                    
                    const batchPromises = batch.map(async (email, batchIndex) => {
                        const result = await processEmail(email, i + batchIndex);
                        
                        if (result) {
                            results.push(result);
                            processingTimes.push(result.processingTime);

                            if (result.success) {
                                stats.success++;
                            } else if (result.error && result.error.includes('not found')) {
                                stats.notFound++;
                            } else {
                                stats.failed++;
                            }

                            stats.processed++;
                            stats.avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;

                            const currentTime = Date.now();
                            stats.elapsedTime = (currentTime - stats.startTime) / 1000;

                            completedCount++;
                            if (completedCount % 5 === 0 || completedCount === emails.length) {
                                try {
                                    await updateCallback(stats);
                                } catch (updateError) {
                                    console.log(`⚠️ Update callback error:`, updateError.message);
                                }
                            }
                        }
                        
                        return result;
                    });

                    await Promise.all(batchPromises);

                    if (i + maxConcurrent < emails.length) {
                        await this.delay(500);
                    }
                }

                await updateCallback(stats);
            };

            await processInBatches(emails);

            return results;
        } finally {
            console.log(`🏁 Token processing finished`);
            this.isProcessing = false;
        }
    }

    stop() {
        this.shouldStop = true;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isCurrentlyProcessing() {
        return this.isProcessing;
    }
}

module.exports = new TokenProcessor();