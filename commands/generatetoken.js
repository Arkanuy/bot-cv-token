const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const tokenProcessor = require('../services/tokenProcessor');
const EmbedUtils = require('../utils/embedUtils');
const backgroundUpdater = require('../utils/backgroundUpdater');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('generatetoken')
        .setDescription('Generate tokens for multiple accounts')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('Upload a text file containing emails (one per line)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('platform')
                .setDescription('Platform to use for token generation')
                .addChoices(
                    { name: 'Windows', value: 'Windows' },
                    { name: 'macOS', value: 'macOS' },
                    { name: 'Android', value: 'Android' }
                )),

    async execute(interaction) {
        console.log(`\n=== Token Generation Request ===`);
        console.log(`User: ${interaction.user.tag} (${interaction.user.id})`);
        console.log(`Guild: ${interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : 'Direct Message'}`);
        
        const sessionId = `${interaction.user.id}_${Date.now()}`;
        
        if (tokenProcessor.isCurrentlyProcessing()) {
            console.log(`❌ Request denied - already processing`);
            return interaction.reply({
                content: '❌ A token generation process is already running. Please wait for it to complete.',
                ephemeral: true
            });
        }

        console.log(`⏳ Deferring reply...`);
        await interaction.deferReply();

        const file = interaction.options.getAttachment('file');
        const platform = interaction.options.getString('platform') || 'Windows';

        console.log(`📁 File: ${file.name} (${file.size} bytes)`);
        console.log(`🖥️ Platform: ${platform}`);

        if (!file.name.endsWith('.txt')) {
            console.log(`❌ Invalid file type: ${file.name}`);
            return interaction.editReply({
                content: '❌ Please upload a .txt file containing emails (one per line).',
                ephemeral: true
            });
        }

        try {
            console.log(`📥 Downloading file from: ${file.url}`);
            const response = await axios.get(file.url);
            const content = response.data;
            const emails = content.split('\n')
                .map(line => {
                    const trimmed = line.trim();
                    const colonIndex = trimmed.indexOf(':');
                    const pipeIndex = trimmed.indexOf('|');
                    
                    if (colonIndex > 0 && (pipeIndex < 0 || colonIndex < pipeIndex)) {
                        return trimmed.substring(0, colonIndex).trim();
                    } else if (pipeIndex > 0) {
                        return trimmed.substring(0, pipeIndex).trim();
                    }
                    return trimmed;
                })
                .filter(email => email.length > 0);

            console.log(`📧 Found ${emails.length} emails in file`);

            if (emails.length === 0) {
                console.log(`❌ No valid emails found`);
                return interaction.editReply({
                    content: '❌ No valid emails found in the file.',
                    ephemeral: true
                });
            }

            if (emails.length > 1000) {
                console.log(`❌ Too many emails: ${emails.length}`);
                return interaction.editReply({
                    content: '❌ Too many emails. Maximum allowed is 1000 emails per batch.',
                    ephemeral: true
                });
            }

            let currentMessage = null;
            const sharedStats = {
                total: emails.length,
                processed: 0,
                success: 0,
                failed: 0,
                notFound: 0,
                retrying: 0,
                startTime: Date.now(),
                avgTime: 0,
                elapsedTime: 0
            };

            const realTimeUpdateCallback = async (stats) => {
                try {
                    const embed = EmbedUtils.createProgressEmbed(stats);
                    
                    if (!currentMessage) {
                        currentMessage = await interaction.editReply({
                            embeds: [embed]
                        });
                    } else {
                        try {
                            await currentMessage.edit({
                                embeds: [embed]
                            });
                        } catch (editError) {
                            if (editError.code === 10008) {
                                console.log(`🔄 Message expired, creating new embed...`);
                                currentMessage = await interaction.followUp({
                                    embeds: [embed]
                                });
                            } else {
                                throw editError;
                            }
                        }
                    }
                } catch (error) {
                    console.log(`⚠️ Real-time update error: ${error.message}`);
                    try {
                        const embed = EmbedUtils.createProgressEmbed(stats);
                        currentMessage = await interaction.followUp({
                            embeds: [embed]
                        });
                    } catch (followUpError) {
                        console.error('❌ Error in fallback update:', followUpError.message);
                    }
                }
            };

            backgroundUpdater.startRealTimeUpdates(sessionId, realTimeUpdateCallback, sharedStats, 2000);

            const statsUpdateCallback = (newStats) => {
                Object.assign(sharedStats, newStats);
                console.log(`📊 Progress: ${sharedStats.processed}/${sharedStats.total} (${((sharedStats.processed/sharedStats.total)*100).toFixed(1)}%) | Success: ${sharedStats.success} | Failed: ${sharedStats.failed} | Not Found: ${sharedStats.notFound}`);
            };

            console.log(`🚀 Starting token generation for ${emails.length} accounts with platform: ${platform}`);

            const results = await tokenProcessor.processAccounts(emails, platform, statsUpdateCallback);

            backgroundUpdater.stopRealTimeUpdates(sessionId);

            const finalStats = {
                total: emails.length,
                processed: emails.length,
                success: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success && (!r.error || !r.error.includes('not found'))).length,
                notFound: results.filter(r => !r.success && r.error && r.error.includes('not found')).length,
                elapsedTime: (Date.now() - tokenProcessor.startTime) / 1000 || 0
            };

            console.log(`\n=== Final Results ===`);
            console.log(`✅ Success: ${finalStats.success}`);
            console.log(`❌ Failed: ${finalStats.failed}`);
            console.log(`🚫 Not Found: ${finalStats.notFound}`);
            console.log(`⏱️ Total Time: ${finalStats.elapsedTime.toFixed(1)}s`);

            const completedEmbed = EmbedUtils.createCompletedEmbed(finalStats);

            const successfulTokens = results
                .filter(r => r.success)
                .map(r => `${r.token}`)
                .join('\n');

            const failedEmails = results
                .filter(r => !r.success)
                .map(r => `${r.email}:${r.error}`)
                .join('\n');

            const attachments = [];

            if (successfulTokens) {
                const successFile = Buffer.from(successfulTokens, 'utf8');
                attachments.push(new AttachmentBuilder(successFile, { name: 'successful_tokens.txt' }));
                console.log(`📄 Generated successful_tokens.txt (${successFile.length} bytes)`);
            }

            if (failedEmails) {
                const failedFile = Buffer.from(failedEmails, 'utf8');
                attachments.push(new AttachmentBuilder(failedFile, { name: 'failed_emails.txt' }));
                console.log(`📄 Generated failed_emails.txt (${failedFile.length} bytes)`);
            }

            try {
                console.log(`📤 Updating final embed...`);
                if (!currentMessage) {
                    await interaction.editReply({
                        embeds: [completedEmbed]
                    });
                } else {
                    await currentMessage.edit({
                        embeds: [completedEmbed]
                    });
                }
            } catch (error) {
                console.log(`⚠️ Failed to update final embed, creating new one...`);
                await interaction.followUp({
                    embeds: [completedEmbed]
                });
            }

            if (attachments.length > 0) {
                try {
                    console.log(`📩 Sending ${attachments.length} files to user DM...`);
                    const user = interaction.user;
                    const dmEmbed = completedEmbed
                        .setTitle('📁 Processing Results - Files')
                        .setDescription(`Results for your token generation request in **${interaction.guild ? interaction.guild.name : 'Direct Message'}**`)
                        .setColor('#27ae60');

                    await user.send({
                        embeds: [dmEmbed],
                        files: attachments
                    });

                    console.log(`✅ Files sent to ${user.tag} via DM`);
                    await interaction.followUp({
                        content: '📩 Result files have been sent to your DM!',
                        ephemeral: true
                    });
                } catch (dmError) {
                    console.error('❌ Error sending DM:', dmError.message);
                    
                    await interaction.followUp({
                        content: '⚠️ Could not send files to your DM (DMs might be disabled). Here are the files:',
                        files: attachments,
                        ephemeral: true
                    });
                    console.log(`📁 Files sent as ephemeral reply instead`);
                }
            } else {
                console.log(`ℹ️ No files to send (no results generated)`);
            }

        } catch (error) {
            console.error('❌ Error in generatetoken command:', error);
            
            const errorMessage = error.message === 'Already processing accounts' 
                ? '❌ A token generation process is already running. Please wait for it to complete.'
                : `❌ An error occurred: ${error.message}`;

            try {
                await interaction.editReply({
                    content: errorMessage,
                    ephemeral: true
                });
            } catch (editError) {
                await interaction.followUp({
                    content: errorMessage,
                    ephemeral: true
                });
            }
        } finally {
            backgroundUpdater.stopRealTimeUpdates(sessionId);
            console.log(`=== Token Generation Complete ===\n`);
        }
    }
};
