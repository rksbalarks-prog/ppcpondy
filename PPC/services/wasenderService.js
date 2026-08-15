import 'dotenv/config.js';
import { createWasender } from "wasenderapi";

let wasender = null;

function initializeWasender() {
  if (wasender) return wasender;

  const apiKey = process.env.WASENDER_API_KEY;
  const accessToken = process.env.WASENDER_PERSONAL_ACCESS_TOKEN;
  const webhookSecret = process.env.WASENDER_WEBHOOK_SECRET;

  if (!apiKey || !accessToken) {
    console.error(
      '❌ Wasender initialization failed: Missing WASENDER_API_KEY or WASENDER_PERSONAL_ACCESS_TOKEN in .env'
    );
    return null;
  }

  try {
    wasender = createWasender(
      apiKey,
      accessToken,
      undefined,
      undefined,
      {
        enabled: true,
        maxRetries: 3
      },
      webhookSecret
    );
    console.log('✅ Wasender initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize Wasender:', err.message);
  }

  return wasender;
}

export default initializeWasender;