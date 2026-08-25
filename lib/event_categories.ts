export interface EventCategory {
  id: string;
  phrase_id: string;
}

export const EVENT_CATEGORIES: EventCategory[] = [
  { id: "Sports Events (Participate)", phrase_id: "sports_events_can_participate" },
  { id: "Sports Matches (Spectate)", phrase_id: "sports_matches_for_spectators" },
  { id: "Traditional / Folk Festivals", phrase_id: "traditional_folk_festivals" },
  { id: "Culinary Fairs", phrase_id: "culinary_fairs" },
  { id: "Live Cultural / Nighttime Shows", phrase_id: "live_cultural_nighttime_shows" },
  { id: "Craft Workshops", phrase_id: "craft_workshops" },
  { id: "Expos", phrase_id: "expos" },
  { id: "Concerts", phrase_id: "concerts" },
  { id: "Other", phrase_id: "other" }
];

export const OTHER_CATEGORY_ID = EVENT_CATEGORIES.find(
  c => c.phrase_id === "other" || c.id.toLowerCase() === "other"
)?.id || "Other";

export const ALL_SPECIFIC_EVENT_CATEGORIES: string[] = EVENT_CATEGORIES
  .filter(c => c.phrase_id !== "other" && c.id.toLowerCase() !== "other")
  .map(c => c.id);
