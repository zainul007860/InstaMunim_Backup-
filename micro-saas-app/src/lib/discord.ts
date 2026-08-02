export const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1519273765802872852/OC4rCgfmPqr2JK_9w17xaR2MHEnX4l2JOmgP11ae4weG5KDWsm4o0dzkPnoNHiWosmII";

export interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

export const sendDiscordAlert = async (
  title: string,
  description: string,
  fields: DiscordField[],
  color: number = 15105570 // Orange by default
) => {
  try {
    if (!DISCORD_WEBHOOK_URL) return;

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "InstaMunim Live System Alerts",
        avatar_url: "https://instamunim.com/icon.png",
        embeds: [{
          title,
          description,
          color,
          fields,
          footer: { text: "InstaMunim Smart POS Alert Engine" },
          timestamp: new Date().toISOString()
        }]
      })
    });
  } catch (err) {
    console.error("Failed to send Discord alert:", err);
  }
};
