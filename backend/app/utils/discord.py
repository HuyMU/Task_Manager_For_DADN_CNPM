import httpx
from datetime import datetime
from app.config import settings
import logging
import asyncio

logger = logging.getLogger(__name__)

async def send_discord_notification(title: str, description: str, color: int = 3447003, url: str = '') -> None:
    webhook_url = settings.discord_webhook_url
    if not webhook_url or not webhook_url.startswith('http'):
        return

    embed = {
        "title": title,
        "description": description,
        "color": color,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    if url:
        embed["url"] = url

    payload = {
        "embeds": [embed]
    }

    async def _send():
        try:
            # Add timeout to prevent hanging forever
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(webhook_url, json=payload)
                if not response.is_success:
                    logger.error(f"Discord Webhook API Error: {response.text}")
        except Exception as e:
            logger.error(f"Failed to send Discord notification: {str(e)}")

    # Fire and forget
    asyncio.create_task(_send())
