const fs = require('fs');
const path = require('path');

class ProxyManager {
    constructor() {
        this.proxies = [];
        this.loadProxies();
    }

    loadProxies() {
        try {
            const proxyPath = path.join(__dirname, '..', 'proxy.txt');
            if (fs.existsSync(proxyPath)) {
                const data = fs.readFileSync(proxyPath, 'utf8');
                this.proxies = data.split('\n').filter(line => line.trim() !== '');
                console.log(`Loaded ${this.proxies.length} proxies`);
            } else {
                console.warn('proxy.txt not found');
                this.proxies = [];
            }
        } catch (error) {
            console.error('Error loading proxies:', error);
            this.proxies = [];
        }
    }

    getRandomProxy() {
        if (this.proxies.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * this.proxies.length);
        return this.proxies[randomIndex];
    }

    reloadProxies() {
        this.loadProxies();
    }
}

module.exports = new ProxyManager();