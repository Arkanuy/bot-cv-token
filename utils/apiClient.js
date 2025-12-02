const axios = require('axios');

class ApiClient {
    constructor() {
        this.baseURL = process.env.API_URL;
        this.maxThreads = parseInt(process.env.MAX_THREADS) || 100;
        this.maxRetries = parseInt(process.env.AUTO_RETRY) || 3;
        this.activeRequests = 0;
    }

    async generateToken(email, proxy, platform = 'Windows') {
        if (this.activeRequests >= this.maxThreads) {
            throw new Error('Maximum thread limit reached');
        }

        this.activeRequests++;
        
        try {
            return await this.generateTokenWithRetry(email, proxy, platform);
        } finally {
            this.activeRequests--;
            console.log(`📉 Active requests: ${this.activeRequests}/${this.maxThreads}`);
        }
    }

    async generateTokenWithRetry(email, proxy, platform, attempt = 1) {
        console.log(`🚀 API Request [${this.activeRequests}/${this.maxThreads}] Attempt ${attempt}/${this.maxRetries}: ${email}`);
        
        try {
            const response = await axios.post(`${this.baseURL}/api/generatetoken`, {
                email: email,
                proxy: proxy,
                platform: platform
            }, {
                timeout: 180000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📡 API Response for ${email}: ${response.data.success ? 'Success' : `Failed - ${response.data.error}`}`);
            return response.data;
        } catch (error) {
            const errorMsg = error.response ? error.response.data?.error || error.response.statusText : error.message;
            console.log(`🔴 API Error for ${email} (Attempt ${attempt}/${this.maxRetries}): ${errorMsg}`);
            
            // Retry logic
            if (attempt < this.maxRetries) {
                const delay = 1000 * attempt;
                console.log(`⏳ Retrying in ${delay}ms...`);
                await this.sleep(delay);
                return this.generateTokenWithRetry(email, proxy, platform, attempt + 1);
            }
            
            // Final attempt failed
            if (error.response) {
                return error.response.data;
            }
            throw error;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getActiveRequests() {
        return this.activeRequests;
    }
}

module.exports = new ApiClient();