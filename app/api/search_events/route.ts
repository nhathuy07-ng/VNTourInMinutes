import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return aiClient;
}

export async function POST(req: NextRequest) {
  try {
    const { city, categories } = await req.json();
    const ai = getAIClient();
    
    const systemInstruction = `You are an event researcher finding upcoming events in Vietnam. 
You must respond ONLY with valid JSON. Do not include markdown blocks like \`\`\`json.
Format your response as an array of objects matching this schema:
[
  {
    "name": "Name of the event",
    "description": "A brief description",
    "source_url": "URL to the source",
    "participations": [
      {
        "date": 1717200000000, 
        "time_start": "19:00",
        "time_end": "23:00",
        "city": "${city}",
        "address_line": "Specific address or location"
      }
    ]
  }
]
For the "date" field in "participations", use a Unix timestamp in milliseconds representing the day of the event.
CRITICAL: For "address_line", DO NOT return vague phrases like "Various locations across ${city}". You MUST provide a specific, physical venue name, building, or street address. If an event is city-wide (like a festival), identify the main venue, opening ceremony location, or primary central gathering spot.`;

    const prompt = `Find upcoming events or festivals in ${city}, Vietnam that fit these categories: ${categories.join(", ")}. Prioritize Vietnam National Tourism Authority's sources and other official news sources. Return a list of events. Make sure to include a valid source_url for each event.`;
    
    console.log("response start")

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      }
    });

    console.log("debug log: ", response.text)
    console.log("response end")

    let jsonText = response.text?.trim() || "[]";
    // Strip markdown code block if present
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\n/, "").replace(/\n```$/, "");
    }
    
    let events = [];
    try {
      events = JSON.parse(jsonText);
    } catch (e) {
      console.error("Failed to parse events JSON", e);
    }
    
    // Fallback if source_url is missing but we have groundingChunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webChunks = chunks.map((chunk: any) => chunk.web?.uri).filter(Boolean);
    
    if (webChunks.length > 0) {
      events = events.map((event: any) => ({
        ...event,
        source_url: event.source_url || webChunks[0]
      }));
    }

    return NextResponse.json({ events });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: "Failed to search events", error: err?.message || String(err) }, { status: 500 });
  }
}
