import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { place_coords, points, preferred_vehicle } = await req.json();
    
    const pts = points || (place_coords ? place_coords.map((c: any) => ({ coords: c })) : []);

    if (!pts || pts.length < 2) {
      return NextResponse.json({ error: "Need at least 2 places" }, { status: 400 });
    }
    
    if (pts.length > 10) {
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

    const getKey = (pt: any) => pt.coords || pt.address || pt.name;

    if (mode === "TRANSIT") {
      const promises = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const o = { address: `${pts[i].name}, ${pts[i].address}` };
        const d = { address: `${pts[i+1].name}, ${pts[i+1].address}` };
        
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
                   const instructions = transitSteps.map((s: any) => {
                     const details = s.transitDetails;
                     const line = details.transitLine?.nameShort || details.transitLine?.name || "";
                     const headsign = details.headsign || "";
                     const departure = details.stopDetails?.departureStop?.name || "";
                     const arrival = details.stopDetails?.arrivalStop?.name || "";
                     const stopCount = details.stopCount ? Number(details.stopCount) : 0;
                     return { line, headsign, departure, arrival, stopCount, stop_count: stopCount };
                   });
                   instruction = JSON.stringify(instructions);
                 } else {
                   instruction = JSON.stringify([{ type: "walk", instruction: "Walk to destination" }]);
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
      for (let i = 0; i < pts.length - 1; i++) {
        mapping[`${getKey(pts[i])}_${getKey(pts[i+1])}`] = results[i];
      }
      
      return NextResponse.json(mapping);
    }

    // For DRIVE and BICYCLE, we can use intermediates
    const origin = { address: `${pts[0].name}, ${pts[0].address}` };
    const destination = { address: `${pts[pts.length - 1].name}, ${pts[pts.length - 1].address}` };
    
    const intermediates = pts.slice(1, -1).map((pt: any) => {
      if (pt.coords && pt.coords.trim() !== "") {
        return { location: { latLng: { latitude: parseFloat(pt.coords.split(",")[0]), longitude: parseFloat(pt.coords.split(",")[1]) } } };
      }
      return { address: `${pt.name}, ${pt.address}` };
    });

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
    for (let i = 0; i < pts.length - 1; i++) {
      const durationStr = legs[i]?.duration || "1800s";
      const secs = parseInt(durationStr.replace("s", ""), 10);
      mapping[`${getKey(pts[i])}_${getKey(pts[i+1])}`] = { duration: secs, instruction: "" };
    }

    return NextResponse.json(mapping);
  } catch (error) {
    console.error("Error computing routes:", error);
    return NextResponse.json({ error: "Failed to compute routes" }, { status: 500 });
  }
}
