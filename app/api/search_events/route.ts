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
    const { city, categories, monthFrom, monthTo } = await req.json();
    const ai = getAIClient();
    
    const systemInstruction = `You are an event researcher finding upcoming events in Vietnam. 
You must respond ONLY with valid JSON. Do not include markdown blocks like \`\`\`json.
Format your response as an array of objects matching this schema:
[
  {
    "name": "Name of the event",
    "description": "A brief description",
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

    let timeConstraint = "upcoming";
    let minDateTs = 0;
    if (monthFrom || monthTo) {
      const fromStr = monthFrom ? `from ${monthFrom}` : "";
      const toStr = monthTo ? `to ${monthTo}` : "";
      timeConstraint = `happening ${fromStr} ${toStr}`.trim();
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      minDateTs = tomorrow.getTime();
      timeConstraint = `happening from ${tomorrow.toISOString().split('T')[0]} onwards`;
    }

    const prompt = `Find ${timeConstraint} events or festivals in ${city}, Vietnam that fit these categories: ${categories.join(", ")}. Prioritize Vietnam National Tourism Authority's sources and other official news sources. Return a list of events.`;
    
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
      let parsedEvents = JSON.parse(jsonText);
      if (Array.isArray(parsedEvents)) {
        if (minDateTs > 0) {
          events = parsedEvents.map((evt: any) => {
             if (evt.participations && Array.isArray(evt.participations)) {
               evt.participations = evt.participations.filter((p: any) => p.date >= minDateTs);
             }
             return evt;
          }).filter((evt: any) => evt.participations && evt.participations.length > 0);
        } else {
          events = parsedEvents;
        }
      }
    } catch (e) {
      console.error("Failed to parse events JSON", e);
    }
    
    // Extract web sources from grounding metadata
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webChunks = chunks.map((chunk: any) => chunk.web?.uri).filter(Boolean);
    const global_sources = [...new Set(webChunks)]; // unique URLs

    return NextResponse.json({ events, global_sources });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: "Failed to search events", error: err?.message || String(err) }, { status: 500 });
  }
}
