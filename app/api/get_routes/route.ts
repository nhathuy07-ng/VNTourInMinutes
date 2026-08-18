import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { place_coords, preferred_vehicle } = await req.json();

    if (!place_coords || place_coords.length < 2) {
      return NextResponse.json({ error: "Need at least 2 places" }, { status: 400 });
    }
    
    if (place_coords.length > 10) {
      return NextResponse.json({ error: "Maximum 10 places allowed in an itinerary" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google Maps Platform API key is missing" }, { status: 500 });
    }

    const travelModeMap: Record<string, string> = {
      CAR: "DRIVE",
      BIKE: "BICYCLE",
      BUS: "TRANSIT"
    };

    const mode = travelModeMap[preferred_vehicle] || "DRIVE";

    const mapping: Record<string, { duration: number, instruction?: string }> = {};

    if (mode === "TRANSIT") {
      const promises = [];
      for (let i = 0; i < place_coords.length - 1; i++) {
        const o = { location: { latLng: { latitude: parseFloat(place_coords[i].split(",")[0]), longitude: parseFloat(place_coords[i].split(",")[1]) } } };
        const d = { location: { latLng: { latitude: parseFloat(place_coords[i+1].split(",")[0]), longitude: parseFloat(place_coords[i+1].split(",")[1]) } } };
        
        promises.push(
          fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": "routes.duration,routes.legs.steps.transitDetails",
            },
            body: JSON.stringify({
              origin: o,
              destination: d,
              travelMode: mode,
            })
          }).then(res => res.json()).then(data => {
            if (data.routes && data.routes.length > 0) {
               const route = data.routes[0];
               const durationStr = route.duration || "1800s";
               const duration = parseInt(durationStr.replace("s", ""), 10);
               
               let instruction = "";
               if (route.legs && route.legs[0] && route.legs[0].steps) {
                 const steps = route.legs[0].steps;
                 const transitSteps = steps.filter((s: any) => s.transitDetails);
                 if (transitSteps.length > 0) {
                   const details = transitSteps[0].transitDetails;
                   const line = details.transitLine?.nameShort || details.transitLine?.name || "Transit";
                   const headsign = details.headsign ? ` towards ${details.headsign}` : "";
                   const departure = details.stopDetails?.departureStop?.name || "station";
                   const arrival = details.stopDetails?.arrivalStop?.name || "station";
                   const stops = details.stopCount ? ` (${details.stopCount} stops)` : "";
                   instruction = JSON.stringify({ line: `${line}${headsign}`, departure, arrival, stops });
                 } else {
                   instruction = JSON.stringify({ type: "walk", instruction: "Walk to destination" });
                 }
               }

               return { duration, instruction };
            }
            return { duration: 1800, instruction: "" };
          }).catch((e) => {
             console.error("Transit fetch error", e);
             return { duration: 1800, instruction: "" };
          })
        );
      }
      
      const results = await Promise.all(promises);
      for (let i = 0; i < place_coords.length - 1; i++) {
        mapping[`${place_coords[i]}_${place_coords[i+1]}`] = results[i];
      }
      
      return NextResponse.json(mapping);
    }

    // For DRIVE and BICYCLE, we can use intermediates
    const origin = { location: { latLng: { latitude: parseFloat(place_coords[0].split(",")[0]), longitude: parseFloat(place_coords[0].split(",")[1]) } } };
    const destination = { location: { latLng: { latitude: parseFloat(place_coords[place_coords.length - 1].split(",")[0]), longitude: parseFloat(place_coords[place_coords.length - 1].split(",")[1]) } } };
    
    const intermediates = place_coords.slice(1, -1).map((coord: string) => ({
      location: { latLng: { latitude: parseFloat(coord.split(",")[0]), longitude: parseFloat(coord.split(",")[1]) } }
    }));

    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.legs.duration",
      },
      body: JSON.stringify({
        origin,
        destination,
        intermediates,
        travelMode: mode,
      })
    });

    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    const legs = data.routes[0].legs;

    // Map A->B travel times in seconds
    for (let i = 0; i < place_coords.length - 1; i++) {
      const durationStr = legs[i]?.duration || "1800s";
      const secs = parseInt(durationStr.replace("s", ""), 10);
      mapping[`${place_coords[i]}_${place_coords[i+1]}`] = { duration: secs, instruction: "" };
    }

    return NextResponse.json(mapping);
  } catch (error) {
    console.error("Error computing routes:", error);
    return NextResponse.json({ error: "Failed to compute routes" }, { status: 500 });
  }
}
