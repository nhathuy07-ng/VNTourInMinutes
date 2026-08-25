import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { EVENT_CATEGORIES } from "@/lib/event_categories";

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
      response_type: "a json array (no markdown blocks, just the JSON string)",
      response_value_language: lang,
      response_schema: [{
        event_name: `event name (in ${lang})`,
        description: `a brief description (in ${lang})`,
        participations: [
          {
            date: "YYYY-MM-DD (e.g. 2026-09-02 in GMT+7)",
            time_start: "19:00",
            time_end: "23:00",
            city: city,
            address_line: "specific address or location"
          }
        ]
      }],
      prioritize_sources: ["Vietnam National Tourism Authority", "official news sources"],
      CRITICAL_OUTPUT_NOTES: [
        "'date' field in 'participations' MUST be in 'YYYY-MM-DD' format representing the event date in GMT+7 (Vietnam time).",
        "'address_line' MUST return a specific, physical venue name, building, or street address. If an event is city-wide (like a festival), identify the main venue, opening ceremony location, or primary central gathering spot."
      ],
      BANNED_PHRASES: [
        `Various location across ${city}`
      ]
    });

    // Get current date and midnight in GMT+7 (Vietnam time)
    const now = new Date();
    const vnDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }); // returns "YYYY-MM-DD"
    const minDateTs = new Date(`${vnDateStr}T00:00:00+07:00`).getTime();

    const otherCategory = EVENT_CATEGORIES.find(c => c.phrase_id === "other" || c.id.toLowerCase() === "other");
    const otherId = otherCategory?.id || "Other";
    const isOtherSelected = Array.isArray(categories) && categories.some(
      (c: string) => c === otherId || c.toLowerCase() === "other"
    );
    const nonOtherCategories = Array.isArray(categories)
      ? categories.filter((c: string) => c !== otherId && c.toLowerCase() !== "other")
      : [];
    const remainingCategories = EVENT_CATEGORIES
      .filter(c => c.phrase_id !== "other" && c.id.toLowerCase() !== "other")
      .map(c => c.id);

    const promptObj: any = {
      task: `find upcoming events in ${city}, Vietnam`,
      city: city,
      suggested_minimum: 5,
      response_value_language: lang
    };

    if (nonOtherCategories.length > 0) {
      promptObj.categories = nonOtherCategories;
    }

    if (isOtherSelected) {
      promptObj.exclude_categories = remainingCategories;
    }

    if (monthFrom) {
      promptObj.from_month = monthFrom;
    }
    if (monthTo) {
      promptObj.to_month = monthTo;
    }
    if (!monthFrom && !monthTo) {
      promptObj.from_date = vnDateStr;
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
        events = parsedEvents.map((evt: any) => {
          if (evt.participations && Array.isArray(evt.participations)) {
            evt.participations = evt.participations.map((p: any) => {
              if (typeof p.date === "string") {
                const cleanDate = p.date.trim().split("T")[0];
                const dateWithTz = `${cleanDate}T00:00:00+07:00`;
                const ts = new Date(dateWithTz).getTime();
                p.date = isNaN(ts) ? new Date(p.date).getTime() : ts;
              }
              return p;
            });
            if (minDateTs > 0) {
              evt.participations = evt.participations.filter((p: any) => p.date >= minDateTs);
            }
          }
          return evt;
        }).filter((evt: any) => evt.participations && evt.participations.length > 0);
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
