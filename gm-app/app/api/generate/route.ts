import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Campaign, Message } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function buildSessionSystemPrompt(campaign: Campaign, sessionTitle: string): string {
  return `You are the Dungeon Master for a Dungeons & Dragons 5th Edition campaign. Your job is to narrate vivid, immersive scenes and react to player actions with creativity and consistency.

CAMPAIGN: ${campaign.name}
SETTING: ${campaign.setting}
TONE: ${campaign.tone}
PARTY SIZE: ${campaign.partySize} players
PARTY LEVEL: ${campaign.partyLevel}
SESSION: ${sessionTitle}

WORLD LORE:
${campaign.lore}

INSTRUCTIONS:
- Narrate in second person ("You see...", "The party enters...")
- Match the campaign tone (${campaign.tone}) at all times
- Be descriptive: include sights, sounds, smells, atmosphere
- Introduce interesting choices and consequences
- Handle combat narratively unless asked for dice rolls
- Keep responses to 2-4 paragraphs unless a long description is needed
- If this is the opening message (no player input), set the scene dramatically for the session
- Stay consistent with the world lore above
- Never break character as DM`;
}

function buildToolSystemPrompt(toolType: string, campaign: Campaign): string {
  const base = `Campaign: ${campaign.name} | Setting: ${campaign.setting} | Tone: ${campaign.tone} | Party Level: ${campaign.partyLevel}
Lore: ${campaign.lore}`;

  if (toolType === "npc") {
    return `You are a D&D NPC generator. Create a compelling NPC for this campaign.
${base}

Generate a detailed NPC with:
- Name and race/class
- Physical appearance (2-3 sentences)
- Personality and mannerisms
- Background and motivation
- A secret or hidden agenda
- Example dialogue line
- Roleplaying tips for the DM

Format with clear sections using markdown headers.`;
  }

  if (toolType === "encounter") {
    return `You are a D&D encounter designer. Create a balanced encounter for this campaign.
${base}

Design a combat or non-combat encounter with:
- Encounter title and setting
- Enemy/NPC participants with CR/stats summary
- Tactics and behavior
- Environmental features that can be used
- Possible outcomes and rewards
- Optional twists or complications

Format with clear sections.`;
  }

  if (toolType === "dungeon") {
    return `You are a D&D dungeon designer. Create a dungeon/location for this campaign.
${base}

Design a location with:
- Name and atmosphere
- 4-6 room/area descriptions with features
- Traps or puzzles (1-2)
- Monsters and their locations
- Treasure and secrets
- History and lore of the location

Format with clear sections.`;
  }

  return `You are a helpful D&D Game Master assistant. Answer clearly and in the context of the campaign.
${base}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, campaign, sessionTitle, messages, playerInput, toolType, prompt } = body as {
      type: "session" | "tool";
      campaign: Campaign;
      sessionTitle?: string;
      messages?: Message[];
      playerInput?: string;
      toolType?: string;
      prompt?: string;
    };

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      return new Response("⚠️ Gemini API key not configured. Add your GEMINI_API_KEY to .env.local", { status: 200 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Tool generation (NPC, encounter, dungeon) — single response
    if (type === "tool") {
      const systemPrompt = buildToolSystemPrompt(toolType || "general", campaign);
      const result = await model.generateContent(`${systemPrompt}\n\nRequest: ${prompt}`);
      const text = result.response.text();
      return new Response(text, { headers: { "Content-Type": "text/plain" } });
    }

    // Session narration — streaming
    const systemPrompt = buildSessionSystemPrompt(campaign, sessionTitle || "Session");

    // Build conversation history for Gemini
    const history = (messages || []).map((m: Message) => ({
      role: m.role === "dm" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am ready to serve as Dungeon Master for this campaign. I will narrate vividly, stay consistent with the world lore, and match the campaign tone." }] },
        ...history,
      ],
    });

    const userMessage = playerInput?.trim()
      ? `The party takes the following action: ${playerInput}`
      : "Begin the session. Set the scene dramatically.";

    const streamResult = await chat.sendMessageStream(userMessage);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            controller.enqueue(new TextEncoder().encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("Gemini error:", err);
    return new Response("*The arcane connection was lost. Please try again.*", { status: 200 });
  }
}
