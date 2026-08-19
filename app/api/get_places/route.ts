import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

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
      ${lesser_known ? "IMPORTANT: The user wants lesser known places. Please ensure candidates have < 1000 reviews." : ""}
      ${pref_accessible ? "IMPORTANT: Prefer wheelchair accessible venues." : ""}
      ${pref_children_friendly ? "IMPORTANT: Prefer child-friendly venues." : ""}
            
      You must respond ONLY with valid JSON adhering to the following schema. Do NOT include markdown blocks like \`\`\`json.
      {
        "introduction": "Brief introduction of the city's vibe (max 50 words)",
        "candidates": [
          {
            "name": "string",
            "maps_place_id": "string (empty if unknown)",
            "maps_coords": "lat,lng as string (CRITICAL: provide EXACT coordinates with at least 6 decimal places, do NOT round)",
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

    const ai = getAIClient();
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
      const parseResponse = (resText: string) => {
        let cleanText = resText.replace(/```json/gi, "").replace(/```/g, "").trim();
        // fix single-quoted property names
        cleanText = cleanText.replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3');
        const parsed = JSON.parse(cleanText);
        if (parsed.candidates && lesser_known) {
          parsed.candidates = parsed.candidates.filter(
            (c: any) => c.rate_count !== undefined && c.rate_count < 1000
          );
        }
        return parsed;
      };

      data = parseResponse(response.text || "{}");

      if (data.candidates && data.candidates.length < 10) {
        const excludedNames = data.candidates.map((c: any) => c.name).join(", ");
        const prompt2 = `Please find 10 more DIFFERENT candidate places in ${city} for a day tour starting at ${datetime}. Do not include these places: ${excludedNames}.`;
        
        const response2 = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: prompt2,
          config: {
            systemInstruction,
            tools: [{ googleMaps: {} }],
          },
        });
        
        const data2 = parseResponse(response2.text || "{}");
        if (data2.candidates) {
          data.candidates = [...data.candidates, ...data2.candidates];
        }
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
