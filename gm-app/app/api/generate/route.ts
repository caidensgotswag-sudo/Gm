import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPlanFromMetadata, canSendMessage } from "@/lib/subscription";
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

  if (toolType === "recap") {
    return `You are summarizing a D&D session for the Dungeon Master. Create a concise, engaging session recap.
${base}

Write a 2-4 paragraph recap in past tense covering:
- What happened in the session (major events, battles, discoveries)
- Key NPCs encountered and any important dialogue or reveals
- Decisions the party made and their consequences
- A cliffhanger or hook for the next session if applicable

Write it like a story recap, not a list. Keep it under 400 words.`;
  }

  if (toolType === "world-lore") {
    return `You are a world-building expert creating deep lore for a D&D campaign.
${base}

Generate rich world lore covering:
## History
- 3-4 major historical events that shaped the world

## Factions & Powers
- 3 major factions (name, goals, methods, symbol)

## Pantheon
- 4-5 deities with domains, symbols, and worshippers

## Geography
- 3-4 notable regions or cities with brief descriptions

## Secrets & Mysteries
- 2 world-level secrets the party could uncover

Format with clear headers and make everything consistent with the campaign setting and tone.`;
  }

  if (toolType === "arc-planner") {
    return `You are a narrative designer helping a DM plan a multi-session story arc.
${base}

Design a compelling story arc with:
## Arc Title & Premise
- A 1-sentence hook

## Act 1 — The Hook (1-2 sessions)
- Inciting incident and initial mystery

## Act 2 — Rising Action (3-5 sessions)
- Key encounters, revelations, and complications
- At least one major twist

## Act 3 — Climax & Resolution (1-2 sessions)
- The final confrontation and resolution
- Consequences for the world

## Key NPCs
- 2-3 important characters introduced in this arc

## Foreshadowing Seeds
- 3 subtle hints to plant in early sessions

Make it fit the campaign lore and tone. Keep it flexible enough that player choices matter.`;
  }

  if (toolType === "magic-item") {
    return `You are a D&D magic item creator. Design a unique, flavorful magic item for this campaign.
${base}

Create a magic item with:
## Item Name
(Evocative, fits the world)

## Type & Rarity
(weapon/armor/wondrous/etc. and common/uncommon/rare/very rare/legendary)

## Description
(Physical appearance, 2-3 sentences)

## Attunement
(Required or not, and by whom)

## Properties
(Mechanical effects, written in 5e style)

## Lore
(History of the item, who made it and why, 2-3 sentences)

## Quirk or Curse (optional)
(An interesting personality trait or drawback)

Make it feel unique, not generic. Tie it to the campaign setting and tone.`;
  }

  if (toolType === "random-tables") {
    return `You are a D&D random table generator. Create useful random tables for this campaign.
${base}

Generate 3 thematic random tables (d8 or d10 each) relevant to the campaign setting. Each table should be immediately useful at the table. Choose from:
- NPC quirks or secrets
- Tavern/location details
- Weather or environmental effects
- Rumors heard in town
- Loot or treasure flavoring
- Encounter complications
- NPC names fitting the setting

Format each table with a title, "Roll a d[X]:" header, and numbered entries. Make entries specific and evocative, not generic.`;
  }

  if (toolType === "pre-session") {
    return `You are a D&D session prep assistant. Help the DM plan their next session.
${base}

Create a session prep outline with:
## Session Goal
(1-2 sentences: what should be accomplished this session)

## Opening Scene
(How to hook the players immediately — in media res or direct consequence of last session)

## Key Beats (3-5)
(Important moments, reveals, or encounters to hit — flexible order)

## Contingencies
(What if the players go off-script? 2-3 alternatives)

## NPCs to Prep
(Which NPCs might appear and their current agenda)

## Potential Cliffhanger
(How to end the session on a hook)

## DM Notes
(Reminders, loose ends to address, foreshadowing to plant)

Keep it concise — this is a prep outline, not a script.`;
  }

  if (toolType === "mood-music") {
    return `You are a D&D atmosphere assistant. Suggest music and ambiance for the current scene.
${base}

Based on the scene description, suggest:
## Mood
(1 sentence describing the emotional tone)

## Music Suggestions (3-4)
(Specific album/playlist/composer names on Spotify/YouTube. Focus on: Two Steps From Hell, Adrian von Ziegler, Nox Arcana, Midnight Syndicate, Jo Blankenburg, or similar)

## Ambient Sound
(Suggest 1-2 ambient soundscapes: e.g. "rainy tavern", "dungeon drips", "forest at night" — searchable on YouTube/Ambient Mixer)

## Lighting Suggestion
(For in-person: candles, dim lights, colored bulb suggestion)

## Scene Tips
(1-2 quick tips to enhance the atmosphere at the table)`;
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

    // Check subscription limits
    const { userId } = await auth();
    if (userId) {
      const user = await currentUser();
      const plan = getPlanFromMetadata((user?.publicMetadata ?? {}) as Record<string, unknown>);

      // Count today's messages from the messages array passed in
      const todayMsgs = (messages || []).filter((m: Message) => {
        return m.role === "dm" && new Date(m.timestamp).toDateString() === new Date().toDateString();
      }).length;

      if (type === "session" && !canSendMessage(plan, todayMsgs)) {
        return new Response(
          `*You've reached your daily limit of ${plan.limits.aiMessagesPerDay} AI messages on the ${plan.name} plan. [Upgrade your plan](/pricing) to continue.*`,
          { status: 200 }
        );
      }
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
