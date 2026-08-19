const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY;
fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=Independence+Palace+Ho+Chi+Minh+City&key=${apiKey}`)
.then(r => r.json()).then(console.log).catch(console.error);
