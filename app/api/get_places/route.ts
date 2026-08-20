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

    const constraints = [];
    if (lesser_known) constraints.push("Places with < 1000 reviews");
    if (pref_accessible) constraints.push("Wheelchair-accessible");
    if (pref_children_friendly) constraints.push("Child-friendly");

    const systemInstruction = JSON.stringify({
      persona: "travel planner",
      task: "find at least 20 places",
      response_type: "json (no markdown blocks, just the JSON string)",
      response_fields: {
        candidates: [
          {
            name: "string",
            maps_place_id: "string (empty if unknown)",
            maps_coords: "lat,lng as string (exact coordinates, 6 decimal places)",
            address: "string",
            opening_time: "HH:MM - HH:MM",
            rating: "number (0-5)",
            rate_count: "number",
            introduction: "string (brief description)",
            category: "string",
            is_outdoor: "boolean",
            suggested_stay_time_secs: "number"
          }
        ]
      }
    }, null, 2);

    const prompt = JSON.stringify({
      task: "find at least 20 places, day tour",
      city: `${city}, Vietnam`,
      place_categories: place_types,
      constraints: constraints,
      tour_start: datetime
    }, null, 2);

    const ai = getAIClient();
    
    const callAI = async (currentPrompt: string) => {
      return await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: currentPrompt,
        config: {
          systemInstruction,
          tools: [{ googleMaps: {} }],
        },
      });
    };

    const response = await callAI(prompt);

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
        const prompt2 = JSON.stringify({
          task: "find 10 more DIFFERENT places, day tour",
          tour_start: datetime,
          excluded_places: excludedNames
        }, null, 2);
        
        const response2 = await callAI(prompt2);
        
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
