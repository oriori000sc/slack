import { WebClient } from "@slack/web-api";

export function slackClient(botToken) {
  return new WebClient(botToken);
}

export async function ensureChannelJoined(client, channelId) {
  try {
    await client.conversations.join({ channel: channelId });
  } catch {
    // already in channel / not allowed etc.
  }
}

export async function getPermalink(client, channel, message_ts) {
  try {
    const r = await client.chat.getPermalink({ channel, message_ts });
    return r?.permalink ?? null;
  } catch {
    return null;
  }
}

export async function listPublicChannels(client, cursor) {
  return client.conversations.list({
    types: "public_channel",
    limit: 200,
    exclude_archived: true,
    cursor
  });
}

export async function history(client, channel, oldest, cursor, limit) {
  return client.conversations.history({
    channel,
    oldest,
    limit,
    cursor,
    inclusive: true
  });
}
