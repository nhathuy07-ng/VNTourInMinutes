import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const {
      city,
      datetime,
      place_types,
      pref_children_friendly,
      pref_accessible,
      lesser_known,
    } = await req.json();

    const systemInstruction = `You are a helpful travel planner specialized in Vietnam.
      You are tasked with finding at least 20 candidate places in ${city} for a day tour.
      The user is interested in these categories: ${place_types.join(", ")}.
      ${lesser_known ? "IMPORTANT: The user wants lesser known places. Please ensure candidates have < 200 reviews." : ""}
      ${pref_accessible ? "IMPORTANT: Prefer wheelchair accessible venues." : ""}
      ${pref_children_friendly ? "IMPORTANT: Prefer child-friendly venues." : ""}
      
      You must respond ONLY with valid JSON adhering to the following schema. Do NOT include markdown blocks like \`\`\`json.
      {
        "introduction": "Brief introduction of the city's vibe (max 50 words)",
        "candidates": [
          {
            "name": "string",
            "maps_place_id": "string (empty if unknown)",
            "maps_coords": "lat,lng as string",
            "address": "string",
            "opening_time": "HH:MM - HH:MM",
            "rating": "number (0-5)",
            "rate_count": "number",
            "introduction": "string (brief description)",
            "category": "string",
            "is_outdoor": "boolean",
            "suggested_stay_time_secs": "number"
          }
        ],
        "extreme_weather": [
           { "hours": "number (0-23)", "condition": "HEAT" | "RAIN" | "UV" }
        ]
      }
      Do not include markdown blocks, just the JSON. Provide at least 15-20 candidates.`;

    const prompt = `Find candidate places in ${city} for a day tour starting at ${datetime}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleMaps: {} }],
      },
    });

    let data;
    try {
      const text = response.text || "{}";
      const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      data = JSON.parse(cleanText);
      
      if (lesser_known && data.candidates) {
        data.candidates = data.candidates.filter(
          (c: any) => c.rate_count !== undefined && c.rate_count < 200
        );
      }
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError, response.text);
      return NextResponse.json({ error: "JSON_PARSE_ERROR", message: "Failed to parse AI response. Please try again." }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in get_places:", error);
    return NextResponse.json({ error: "Failed to fetch places", message: "Internal server error." }, { status: 500 });
  }
}
