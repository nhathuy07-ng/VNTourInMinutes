const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY;
fetch("https://places.googleapis.com/v1/places:searchText", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": "places.id,places.location,places.displayName",
  },
  body: JSON.stringify({
    textQuery: "Independence Palace, Ho Chi Minh City"
  })
}).then(r => r.json()).then(console.log).catch(console.error);
