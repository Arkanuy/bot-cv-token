const { EmbedBuilder } = require('discord.js');

class EmbedUtils {
    static createProgressEmbed(stats) {
        const { processed, total, success, failed, notFound, retrying, elapsedTime, avgTime } = stats;
        
        const percentage = total > 0 ? ((processed / total) * 100).toFixed(1) : 0;
        const eta = this.calculateETA(processed, total, avgTime);
        const progressBar = this.createProgressBar(processed, total);

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🔄 Processing Accounts')
            .addFields(
                {
                    name: 'Progress',
                    value: `${processed}/${total} (${percentage}%)`,
                    inline: false
                },
                {
                    name: 'Status',
                    value: `✅ Success: ${success}\n❌ Failed: ${failed}\n🚫 Not Found: ${notFound}\n🔄 Retrying: ${retrying}`,
                    inline: false
                },
                {
                    name: '\u200b',
                    value: `${progressBar}`,
                    inline: false
                },
                {
                    name: 'Time',
                    value: `⏱️ Elapsed: ${this.formatTime(elapsedTime)}\n🔮 ETA: ${eta}\n⚡ Avg: ${avgTime.toFixed(1)}s/account`,
                    inline: false
                }
            )
            .setTimestamp();

        return embed;
    }

    static createCompletedEmbed(stats) {
        const { total, success, failed, notFound, elapsedTime } = stats;
        
        const embed = new EmbedBuilder()
            .setColor(failed > 0 ? '#f39c12' : '#27ae60')
            .setTitle('✅ Processing Completed')
            .addFields(
                {
                    name: 'Final Results',
                    value: `**Total:** ${total}\n✅ **Success:** ${success}\n❌ **Failed:** ${failed}\n🚫 **Not Found:** ${notFound}`,
                    inline: true
                },
                {
                    name: 'Time Statistics',
                    value: `⏱️ **Total Time:** ${this.formatTime(elapsedTime)}\n⚡ **Average:** ${(elapsedTime / total).toFixed(1)}s/account`,
                    inline: true
                }
            )
            .setTimestamp();

        return embed;
    }

    static createProgressBar(current, total, length = 20) {
        if (total === 0) return '░'.repeat(length);
        
        const progress = Math.floor((current / total) * length);
        const filled = '█'.repeat(progress);
        const empty = '░'.repeat(length - progress);
        return `[${filled}${empty}]`;
    }

    static formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds.toFixed(1)}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }

    static calculateETA(processed, total, avgTime) {
        if (processed === 0 || processed >= total) {
            return 'N/A';
        }
        
        const remaining = total - processed;
        const etaSeconds = remaining * avgTime;
        return this.formatTime(etaSeconds);
    }
}

module.exports = EmbedUtils;