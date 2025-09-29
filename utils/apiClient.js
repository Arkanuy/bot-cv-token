const axios = require('axios');

class ApiClient {
    constructor() {
        this.baseURL = process.env.API_URL;
        this.maxThreads = parseInt(process.env.MAX_THREADS) || 100;
        this.activeRequests = 0;
    }

    async generateToken(email, proxy, platform = 'Windows') {
        if (this.activeRequests >= this.maxThreads) {
            throw new Error('Maximum thread limit reached');
        }

        this.activeRequests++;
        console.log(`🚀 API Request [${this.activeRequests}/${this.maxThreads}]: ${email}`);
        
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
            console.log(`🔴 API Error for ${email}: ${errorMsg}`);
            if (error.response) {
                return error.response.data;
            }
            throw error;
        } finally {
            this.activeRequests--;
            console.log(`📉 Active requests: ${this.activeRequests}/${this.maxThreads}`);
        }
    }

    getActiveRequests() {
        return this.activeRequests;
    }
}

module.exports = new ApiClient();