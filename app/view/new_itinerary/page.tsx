"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ArrowRight, MapPin, Check, Plus, Trash2, GripVertical, CheckCircle2, Share, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";
import { Place, ItineraryItem, Itinerary } from "@/lib/types";

const VIETNAM_CITIES = [
  { id: "hanoi", vi: "Hà Nội", en: "Hanoi" },
  { id: "hcmc", vi: "Hồ Chí Minh", en: "Ho Chi Minh City" },
  { id: "danang", vi: "Đà Nẵng", en: "Da Nang" },
  { id: "hue", vi: "Huế", en: "Hue" },
  { id: "hoian", vi: "Hội An", en: "Hoi An" },
  { id: "dalat", vi: "Đà Lạt", en: "Da Lat" },
  { id: "nhatrang", vi: "Nha Trang", en: "Nha Trang" },
];

const CATEGORIES = [
  { id: "tourist_attraction", label: "Tourist Attraction" },
  { id: "museum", label: "Museum" },
  { id: "park", label: "Park" },
  { id: "historical_landmark", label: "Historical Landmark" },
  { id: "restaurant", label: "Restaurant" },
  { id: "cafe", label: "Cafe" },
  { id: "shopping_mall", label: "Shopping Mall" },
  { id: "amusement_park", label: "Amusement Park" },
  { id: "place_of_worship", label: "Place of Worship" },
  { id: "art_gallery", label: "Art Gallery" },
];

export default function NewItinerary() {
  const router = useRouter();
  const { addItinerary } = useStore();
  const [step, setStep] = useState(1);
  const [city, setCity] = useState("hanoi");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [prefChildrenFriendly, setPrefChildrenFriendly] = useState(false);
  const [prefAccessible, setPrefAccessible] = useState(false);
  const [prefLesserKnown, setPrefLesserKnown] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [candidates, setCandidates] = useState<Place[]>([]);
  const [introduction, setIntroduction] = useState("");
  
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [transport, setTransport] = useState<"CAR"|"BUS"|"BIKE">("CAR");
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasUncalculatedChanges, setHasUncalculatedChanges] = useState(false);

  const [finalName, setFinalName] = useState("");

  const handleNext = async () => {
    if (step === 1) {
      if (!date || selectedCategories.length === 0) return;
      
      if (errorMsg) {
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 500));
      }
      
      setIsLoading(true);
      setErrorMsg("");
      try {
        const datetime = new Date(`${date}T${time}`).toISOString();
        const res = await fetch("/api/get_places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: VIETNAM_CITIES.find(c => c.id === city)?.en || city,
            datetime,
            place_types: selectedCategories,
            pref_children_friendly: prefChildrenFriendly,
            pref_accessible: prefAccessible,
            lesser_known: prefLesserKnown,
            transport
          })
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.message || "Failed to generate tour. Please try again.");
          return;
        }
        const loadedCandidates = data.candidates || [];
        setCandidates(loadedCandidates.map((c: any, i: number) => ({ ...c, local_id: `cand-${i}` })));
        setIntroduction(data.introduction || "");
        setStep(2);
      } catch (e) {
        console.error(e);
        setErrorMsg("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else if (step === 2) {
      const cityName = VIETNAM_CITIES.find(c => c.id === city)?.en || city;
      const formattedDate = new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric" });
      setFinalName(`${cityName} trip, ${formattedDate}`);
      setStep(3);
    }
  };

  const handleCalculateRoutes = async () => {
    if (itineraryItems.length < 2) return;
    setIsCalculating(true);
    try {
      const coords = itineraryItems.map(i => i.maps_coords);
      const res = await fetch("/api/get_routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_coords: coords, preferred_vehicle: transport })
      });
      const travelTimes = await res.json();
      
      let currentStartTime = new Date(`${date}T${time}`);
      const newItems = [...itineraryItems];
      
      for (let i = 0; i < newItems.length; i++) {
        newItems[i].start_time = currentStartTime.toISOString();
        const staySecs = newItems[i].suggested_stay_time_secs || 3600;
        const endTime = new Date(currentStartTime.getTime() + staySecs * 1000);
        newItems[i].end_time = endTime.toISOString();
        
        if (i < newItems.length - 1) {
          const key = `${newItems[i].maps_coords}_${newItems[i+1].maps_coords}`;
          const routeData = travelTimes[key] || { duration: 1800, instruction: "" };
          const travelSecs = routeData.duration;
          newItems[i].transit_instruction = routeData.instruction;
          
          currentStartTime = new Date(endTime.getTime() + travelSecs * 1000);
        } else {
          newItems[i].transit_instruction = undefined;
        }
      }
      setItineraryItems(newItems);
      setHasUncalculatedChanges(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  const addToItinerary = (place: Place) => {
    setCandidates(candidates.filter(c => c.local_id !== place.local_id));
    setItineraryItems([...itineraryItems, { 
      ...place, 
      start_time: "", 
      end_time: "",
      suggested_stay_time_secs: place.suggested_stay_time_secs || 3600 
    }]);
    setHasUncalculatedChanges(true);
  };

  const removeFromItinerary = (index: number) => {
    const item = itineraryItems[index];
    const newItems = [...itineraryItems];
    newItems.splice(index, 1);
    setItineraryItems(newItems);
    setCandidates([item, ...candidates]);
    setHasUncalculatedChanges(true);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= itineraryItems.length) return;
    const newItems = [...itineraryItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + direction];
    newItems[index + direction] = temp;
    setItineraryItems(newItems);
    setHasUncalculatedChanges(true);
  };

  const handleSave = () => {
    addItinerary({
      id: uuidv4(),
      name: finalName,
      Start_DateTime: new Date(`${date}T${time}`).toISOString(),
      City: VIETNAM_CITIES.find(c => c.id === city)?.en || city,
      transport,
      items: itineraryItems
    });
    router.push("/view/main");
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (step === 1) {
    // ... same as before
    return (
      <div className="min-h-screen bg-white text-neutral-900 pb-24 font-sans">
        <header className="h-16 px-4 flex items-center border-b border-neutral-100 sticky top-0 bg-white z-10">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-neutral-400 hover:text-black">
            <ChevronLeft size={24} />
          </button>
          <h1 className="ml-2 font-extrabold tracking-tight text-lg">New Tour</h1>
        </header>

        <main className="p-6 space-y-8 max-w-2xl mx-auto">
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">Destination</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <select 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-md py-3 pl-12 pr-4 text-lg font-medium appearance-none focus:outline-none focus:border-neutral-300"
              >
                {VIETNAM_CITIES.map(c => (
                  <option key={c.id} value={c.id}>{c.en} ({c.vi})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">Date</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-md py-3 px-4 text-lg font-medium focus:outline-none focus:border-neutral-300"
              />
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">Start Time</label>
              <input 
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-md py-3 px-4 text-lg font-medium focus:outline-none focus:border-neutral-300"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">Interests</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (selectedCategories.includes(cat.id)) {
                      setSelectedCategories(selectedCategories.filter(c => c !== cat.id));
                    } else {
                      setSelectedCategories([...selectedCategories, cat.id]);
                    }
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                    selectedCategories.includes(cat.id) 
                      ? "border-black bg-black text-white" 
                      : "border-neutral-200 text-neutral-600 bg-neutral-50 hover:bg-neutral-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">Preferences</label>
            <label className="flex items-center gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors">
              <div className={`w-5 h-5 rounded flex items-center justify-center ${prefChildrenFriendly ? 'bg-black' : 'border border-neutral-300 bg-white'}`}>
                {prefChildrenFriendly && <Check size={14} className="text-white" />}
              </div>
              <input type="checkbox" className="hidden" checked={prefChildrenFriendly} onChange={() => setPrefChildrenFriendly(!prefChildrenFriendly)} />
              <span className="font-semibold text-neutral-800">Child-friendly venues</span>
            </label>
            <label className="flex items-center gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors">
              <div className={`w-5 h-5 rounded flex items-center justify-center ${prefAccessible ? 'bg-black' : 'border border-neutral-300 bg-white'}`}>
                {prefAccessible && <Check size={14} className="text-white" />}
              </div>
              <input type="checkbox" className="hidden" checked={prefAccessible} onChange={() => setPrefAccessible(!prefAccessible)} />
              <span className="font-semibold text-neutral-800">Wheelchair accessible</span>
            </label>
            <label className="flex items-center gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors">
              <div className={`w-5 h-5 rounded flex items-center justify-center ${prefLesserKnown ? 'bg-black' : 'border border-neutral-300 bg-white'}`}>
                {prefLesserKnown && <Check size={14} className="text-white" />}
              </div>
              <input type="checkbox" className="hidden" checked={prefLesserKnown} onChange={() => setPrefLesserKnown(!prefLesserKnown)} />
              <span className="font-semibold text-neutral-800">Lesser known places</span>
            </label>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-100">
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm font-medium border border-red-100 text-center">
                {errorMsg}
              </div>
            )}
            <button
              onClick={handleNext}
              disabled={!date || selectedCategories.length === 0 || isLoading}
              className="w-full py-3 px-6 bg-black text-white rounded-md font-medium text-lg disabled:opacity-50 flex justify-center items-center gap-2 hover:bg-neutral-800 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Finding Places...
                </>
              ) : (errorMsg ? "Retry" : "Next Step")}
              {!isLoading && !errorMsg && <ArrowRight size={20} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
        <header className="h-16 px-4 flex items-center bg-white border-b border-neutral-100 shrink-0">
          <button onClick={() => setStep(1)} className="p-2 -ml-2 text-neutral-400 hover:text-black">
            <ChevronLeft size={24} />
          </button>
          <div className="ml-2">
            <h1 className="font-extrabold tracking-tight text-lg">Plan Itinerary</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
          {/* Pending Itinerary */}
          <div className="p-4 max-h-[40vh] overflow-y-auto shrink-0 border-b border-neutral-100">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Your Itinerary ({itineraryItems.length}/10)</h2>
            
            {itineraryItems.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <p>Select places from below to add to your tour.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {itineraryItems.map((item, idx) => (
                  <div key={item.maps_place_id || `itinerary-${idx}`} className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex items-center gap-4">
                    <div className="flex flex-col gap-1 text-neutral-400">
                      <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="hover:text-black"><ChevronLeft className="rotate-90" size={20} /></button>
                      <button onClick={() => moveItem(idx, 1)} disabled={idx === itineraryItems.length - 1} className="hover:text-black"><ChevronLeft className="-rotate-90" size={20} /></button>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base leading-tight">{item.name}</h3>
                      <div className="flex justify-between mt-2 text-sm text-neutral-600 font-medium">
                        <span className="bg-white px-2 py-1 rounded border border-neutral-200">{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                        <span className="bg-white px-2 py-1 rounded border border-neutral-200">{Math.round((item.suggested_stay_time_secs || 3600) / 60)} mins</span>
                      </div>
                    </div>
                    <button onClick={() => removeFromItinerary(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-md shrink-0">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Candidates */}
          <div className="p-4 pb-32 flex-1">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Suggestions</h2>
            <div className="flex overflow-x-scroll gap-4 pb-4 snap-x">
              {candidates.map((c, idx) => (
                <div key={c.local_id || `candidate-${idx}`} className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 flex flex-col gap-3 min-w-[280px] w-[280px] snap-start shrink-0">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-base leading-tight">{c.name}</h3>
                    <p className="text-sm text-neutral-500">{c.category} • {c.is_outdoor ? "Outdoor" : "Indoor"}</p>
                    <div className="flex items-center gap-1 bg-white border border-neutral-200 px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-widest text-neutral-500 w-max mt-1">
                      <span>★</span>
                      <span className="text-neutral-900">{c.rating}</span>
                      <span>({c.rate_count})</span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed line-clamp-3 flex-1">{c.introduction}</p>
                  <button 
                    onClick={() => addToItinerary(c)}
                    disabled={itineraryItems.length >= 10}
                    className="w-full mt-auto py-2 bg-black text-white font-medium rounded-md flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-50 transition-colors shrink-0"
                  >
                    <Plus size={16} /> {itineraryItems.length >= 10 ? "Limit Reached (10)" : "Add to Tour"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 p-4 space-y-3 z-10">
          <div className="max-w-2xl mx-auto flex gap-2">
            {(["CAR", "BUS", "BIKE"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTransport(t); setHasUncalculatedChanges(true); }}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-widest rounded-md border transition-colors ${transport === t ? "bg-black border-black text-white" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              onClick={handleCalculateRoutes}
              disabled={!hasUncalculatedChanges || itineraryItems.length < 2 || isCalculating}
              className="flex-1 py-3 bg-neutral-100 text-neutral-900 rounded-md font-medium disabled:opacity-50 hover:bg-neutral-200 transition-colors"
            >
              {isCalculating ? "Calculating..." : "Recalculate Routes"}
            </button>
            <button
              onClick={handleNext}
              disabled={itineraryItems.length === 0 || hasUncalculatedChanges}
              className="flex-1 py-3 bg-black text-white rounded-md font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors"
            >
              Save Tour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mb-6 text-white">
        <CheckCircle2 size={32} />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-4">Tour Finalized!</h1>
      <p className="text-lg text-neutral-500 font-light leading-relaxed mb-8">Give your tour a name to save it.</p>

      <div className="w-full max-w-sm space-y-4">
        <input 
          type="text"
          value={finalName}
          onChange={(e) => setFinalName(e.target.value)}
          className="w-full bg-neutral-50 border border-neutral-200 rounded-md py-3 px-4 text-center text-lg font-bold focus:outline-none focus:border-neutral-300"
        />
        
        <button
          onClick={handleSave}
          className="w-full py-3 bg-black text-white rounded-md font-medium text-lg hover:bg-neutral-800 transition-colors"
        >
          Save and Finish
        </button>
        
        <button
          onClick={() => {}}
          className="w-full py-3 bg-white text-neutral-900 border border-neutral-200 rounded-md font-medium text-lg flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
        >
          <Share size={20} /> Export / Share
        </button>
      </div>
    </div>
  )
}
