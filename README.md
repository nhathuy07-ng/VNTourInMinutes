# Smart Itinerary Planner

A minimalist, AI-powered travel itinerary generator that helps users build custom tours, complete with precise travel times and public transit instructions.

## Features

* **AI-Powered Suggestions**: Uses Google Gemini to recommend attractions based on your preferences (including filtering for lesser-known spots).
* **Intelligent Routing**: Integrates with the Google Maps Platform Routes API to calculate travel times for driving, cycling, and public transit.
* **Transit Guides**: Automatically parses transit legs to provide detailed bus boarding instructions, headsigns, and stop counts.
* **Custom Tour Builder**: Curate your own itinerary with a realistic 10-place limit.
* **Cloud Sync**: Saves and organizes upcoming and past trips in chronological order.

## Tech Stack

* **Framework**: Next.js (App Router)
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **AI & Maps**: Google Gemini API, Google Maps Platform (Routes API)
* **Database**: Firebase Firestore

## Setup

To run this project, ensure you have the following environment variables configured in your `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_PLATFORM_KEY=your_maps_api_key
```

Install dependencies and start the development server:

```bash
npm install
npm run dev
```
