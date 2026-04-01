const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); 
// Or just use global fetch if supported in Node 18+
const nodeFetch = globalThis.fetch || fetch;

/**
 * Sends a notification to a Discord channel via Webhook using Embeds
 * @param {string} title - The embed title
 * @param {string} description - The embed description body
 * @param {number} color - Decimal color code (e.g., green: 3066993, red: 15158332)
 * @param {string} url - Optional URL to attach to title
 */
async function sendDiscordNotification(title, description, color = 3447003, url = '') {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
        return; // Silently ignore if not configured
    }

    const embed = {
        title: title,
        description: description,
        color: color,
        timestamp: new Date().toISOString()
    };

    if (url) {
        embed.url = url;
    }

    const payload = {
        embeds: [embed]
    };

    try {
        console.log('Sending payload to discord...', JSON.stringify(payload));
        const response = await nodeFetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('Discord Response Status:', response.status);
        if (!response.ok) {
            console.error('Discord Webhook API Error:', await response.text());
        } else {
            console.log('Discord message sent successfully.');
        }
    } catch (error) {
        console.error('Failed to send Discord notification:', error.message);
    }
}

module.exports = {
    sendDiscordNotification
};
