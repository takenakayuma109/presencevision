// ---------------------------------------------------------------------------
// Channel Format Converter
// Defines output dimensions per channel and converts card configs to
// HTML templates for all connected channels.
// ---------------------------------------------------------------------------

import { generateCardHTML, type CardConfig, type GeneratedCard } from "./card-generator";

// ---------------------------------------------------------------------------
// Channel format definitions
// ---------------------------------------------------------------------------

export interface ChannelFormat {
  width: number;
  height: number;
  name: string;
}

export const CHANNEL_FORMATS: Record<string, ChannelFormat> = {
  twitter: { width: 1200, height: 675, name: "Twitter/X Card" },
  instagram_square: { width: 1080, height: 1080, name: "Instagram Square" },
  instagram_story: { width: 1080, height: 1920, name: "Instagram Story" },
  linkedin: { width: 1200, height: 627, name: "LinkedIn Post" },
  pinterest: { width: 1000, height: 1500, name: "Pinterest Pin" },
  facebook: { width: 1200, height: 630, name: "Facebook Post" },
  youtube_thumbnail: { width: 1280, height: 720, name: "YouTube Thumbnail" },
  og: { width: 1200, height: 630, name: "OG Image" },
} as const;

// Map extended channel keys to the CardConfig channel type used by the card generator
const CHANNEL_TO_CARD_CHANNEL: Record<string, CardConfig["channel"]> = {
  twitter: "twitter",
  instagram_square: "instagram",
  instagram_story: "instagram",
  linkedin: "linkedin",
  pinterest: "pinterest",
  facebook: "facebook",
  youtube_thumbnail: "twitter", // similar 16:9 aspect
  og: "facebook", // same 1200x630
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getFormatForChannel(channel: string): ChannelFormat | null {
  return CHANNEL_FORMATS[channel] ?? null;
}

export function listAvailableFormats(): Array<{ key: string } & ChannelFormat> {
  return Object.entries(CHANNEL_FORMATS).map(([key, format]) => ({
    key,
    ...format,
  }));
}

/**
 * Generate HTML templates for all specified channels (or all channels if none
 * are specified). Each format adapts layout based on aspect ratio.
 */
export function generateForAllChannels(
  config: Omit<CardConfig, "channel">,
  channels?: string[]
): GeneratedCard[] {
  const targetChannels = channels?.length
    ? channels
    : Object.keys(CHANNEL_FORMATS);

  return targetChannels
    .filter((ch) => ch in CHANNEL_FORMATS)
    .map((ch) => {
      const format = CHANNEL_FORMATS[ch];
      const cardChannel = CHANNEL_TO_CARD_CHANNEL[ch] ?? "twitter";

      // Generate using the card generator with the mapped channel
      const card = generateCardHTML({ ...config, channel: cardChannel });

      // Override dimensions to match the exact channel format (e.g. instagram_story
      // uses "instagram" card layout but with 1080x1920 dimensions)
      return rewriteDimensions(card, format.width, format.height, ch);
    });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Rewrite the width/height inside the generated HTML to match the target
 * format dimensions. This ensures the HTML renders at the exact required
 * size when captured by Playwright.
 */
function rewriteDimensions(
  card: GeneratedCard,
  width: number,
  height: number,
  channelKey: string
): GeneratedCard {
  let html = card.html;

  // Replace viewport width
  html = html.replace(
    /width=\d+/,
    `width=${width}`
  );

  // Replace body dimensions
  html = html.replace(
    /body\s*\{\s*width:\d+px;\s*height:\d+px;/,
    `body { width:${width}px; height:${height}px;`
  );

  // Replace outer container dimensions
  html = html.replace(
    /width:\d+px;\s*\n\s*height:\d+px;\s*\n\s*background:linear-gradient/,
    `width:${width}px;\n  height:${height}px;\n  background:linear-gradient`
  );

  return {
    html,
    width,
    height,
    channel: channelKey,
  };
}
