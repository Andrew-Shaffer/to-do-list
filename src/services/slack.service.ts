// src/services/slack.service.ts
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function sendSlackMessage(text: string): Promise<void> {
  await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID!,
    text,
  });
}

// Optional: send a richer "block" message
export async function sendSlackBlock(title: string, body: string): Promise<void> {
  await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID!,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: title },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: body },
      },
    ],
    text: title, // fallback for notifications
  });
}