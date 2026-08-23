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
    const { city, categories, monthFrom, monthTo, response_value_language } = await req.json();
    const ai = getAIClient();
    
    const lang = response_value_language === "vi" || response_value_language === "vietnamese" ? "Vietnamese" : "English";

    const systemInstruction = JSON.stringify({
      persona: "event researcher",
      task: `find upcoming events in ${city}, Vietnam`,
      response_type: "json",
      response_value_language: lang,
      response_schema: [{
        name: `event name (in ${lang})`,
        description: `a brief description (in ${lang})`,
        participations: [
          {
            date: 1717200000000,
            time_start: "19:00",
            time_end: "23:00",
            city: city,
            address_line: "specific address or location"
          }
        ]
      }],
      prioritize_sources: ["Vietnam National Tourism Authority", "official news sources"],
      CRITICAL_OUTPUT_NOTES: [
        "No markdown blocks like ```json",
        "'date' field in 'participations' use Unix timestamp in milliseconds representing event's day.",
        "'address_line' MUST return a specific, physical venue name, building, or street address. If an event is city-wide (like a festival), identify the main venue, opening ceremony location, or primary central gathering spot."
      ],
      BANNED_PHRASES: [
        `Various location across ${city}`
      ]
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const minDateTs = tomorrow.getTime();

    const promptObj: any = {
      task: `find upcoming events in ${city}, Vietnam`,
      city: city,
      categories: categories,
      response_value_language: lang
    };

    if (monthFrom) {
      promptObj.from_month = monthFrom;
    }
    if (monthTo) {
      promptObj.to_month = monthTo;
    }
    if (!monthFrom && !monthTo) {
      promptObj.from_date = tomorrow.toISOString().split('T')[0];
    }

    const prompt = JSON.stringify(promptObj, null, 2);
    
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
