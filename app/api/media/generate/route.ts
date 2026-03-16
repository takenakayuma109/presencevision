import { NextRequest, NextResponse } from "next/server";
import { generateCardHTML, type CardConfig } from "@/lib/media/card-generator";
import { generateOGImageHTML } from "@/lib/media/og-generator";
import { CHANNEL_FORMATS, generateForAllChannels } from "@/lib/media/format-converter";

interface GenerateMediaRequest {
  title?: string;
  points?: string[];
  brandColors?: { primary: string; secondary: string; accent: string };
  logoUrl?: string;
  siteUrl?: string;
  channels?: string[];
  description?: string; // used for OG image generation
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateMediaRequest;
    const { title, points, brandColors, logoUrl, siteUrl, channels, description } = body;

    // Validation
    if (!title || !points || !brandColors || !siteUrl) {
      return NextResponse.json(
        { error: "title, points, brandColors, and siteUrl are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(points) || points.length === 0) {
      return NextResponse.json(
        { error: "points must be a non-empty array of strings" },
        { status: 400 }
      );
    }

    if (!brandColors.primary || !brandColors.secondary || !brandColors.accent) {
      return NextResponse.json(
        { error: "brandColors must include primary, secondary, and accent" },
        { status: 400 }
      );
    }

    const requestedChannels = channels?.length ? channels : [];

    // Validate that all requested channels exist
    const invalidChannels = requestedChannels.filter(
      (ch) => !(ch in CHANNEL_FORMATS) && !isCardChannel(ch)
    );
    if (invalidChannels.length > 0) {
      return NextResponse.json(
        { error: `Unknown channels: ${invalidChannels.join(", ")}` },
        { status: 400 }
      );
    }

    // Separate card channels from format-converter channels
    const cardChannels = requestedChannels.filter(isCardChannel);
    const extendedChannels = requestedChannels.filter(
      (ch) => ch in CHANNEL_FORMATS && !isCardChannel(ch)
    );

    const results: Array<{
      channel: string;
      html: string;
      width: number;
      height: number;
    }> = [];

    // Generate cards for standard card channels
    for (const ch of cardChannels) {
      const config: CardConfig = {
        title,
        points,
        brandColors,
        logoUrl,
        siteUrl,
        channel: ch as CardConfig["channel"],
      };
      const card = generateCardHTML(config);
      results.push({
        channel: card.channel,
        html: card.html,
        width: card.width,
        height: card.height,
      });
    }

    // Generate cards for extended format channels (instagram_story, youtube_thumbnail, og, etc.)
    if (extendedChannels.length > 0) {
      const baseConfig = { title, points, brandColors, logoUrl, siteUrl };
      const extendedCards = generateForAllChannels(baseConfig, extendedChannels);
      for (const card of extendedCards) {
        results.push({
          channel: card.channel,
          html: card.html,
          width: card.width,
          height: card.height,
        });
      }
    }

    // If "og" is requested and description is provided, also generate dedicated OG image
    if (requestedChannels.includes("og") && description) {
      const og = generateOGImageHTML(title, description, brandColors, logoUrl);
      // Replace the card-based OG entry with the dedicated OG template
      const ogIdx = results.findIndex((r) => r.channel === "og");
      const ogEntry = {
        channel: "og",
        html: og.html,
        width: og.width,
        height: og.height,
      };
      if (ogIdx >= 0) {
        results[ogIdx] = ogEntry;
      } else {
        results.push(ogEntry);
      }
    }

    return NextResponse.json({ cards: results }, { status: 200 });
  } catch (error) {
    console.error("POST /api/media/generate:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate media",
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CARD_CHANNELS = new Set(["twitter", "instagram", "linkedin", "pinterest", "facebook"]);

function isCardChannel(ch: string): boolean {
  return CARD_CHANNELS.has(ch);
}
