"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight, MapPin, Check, Plus, Trash2, GripVertical, CheckCircle2, Share as _Share, Loader2, Info, X, AlertTriangle, Edit2, Car, Bus, Bike } from "lucide-react";
import { useStore } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";
import { Place, ItineraryItem, Itinerary } from "@/lib/types";
import { VIETNAM_CITIES, GENERIC_PLACE_TYPES } from "@/lib/cities";

export default function NewItinerary() {
  const router = useRouter();
  const { addItinerary } = useStore();
  const [step, setStep] = useState(1);
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [prefChildrenFriendly, setPrefChildrenFriendly] = useState(false);
  const [prefAccessible, setPrefAccessible] = useState(false);
  const [prefLesserKnown, setPrefLesserKnown] = useState(false);
  const [showMorePlaces, setShowMorePlaces] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [candidates, setCandidates] = useState<Place[]>([]);
  const [introduction, setIntroduction] = useState("");
  
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [showCityInfoPopup, setShowCityInfoPopup] = useState(false);
  const [cityInfoSearchQuery, setCityInfoSearchQuery] = useState("");
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [showTimeWarningPopup, setShowTimeWarningPopup] = useState(false);
  
  const handleBackClick = () => {
    if (itineraryItems.length > 0 || candidates.length > 0 || step > 1) {
      setShowDiscardPopup(true);
    } else {
      router.push("/view/main");
    }
  };

  const isPlaceClosed = (item: ItineraryItem) => {
    if (!item.opening_time || !item.start_time || !item.end_time) return false;
    const lower = item.opening_time.toLowerCase();
    if (lower.includes("24 hours") || lower.includes("24/7")) return false;
    
    const match = item.opening_time.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (!match) return false;
    const [_, open, close] = match;
    
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    
    let openMins = parseTime(open);
    let closeMins = parseTime(close);
    if (closeMins < openMins) closeMins += 24 * 60;

    let startMins = new Date(item.start_time).getHours() * 60 + new Date(item.start_time).getMinutes();
    let endMins = new Date(item.end_time).getHours() * 60 + new Date(item.end_time).getMinutes();
    
    if (endMins < startMins) endMins += 24 * 60;
    if (startMins < openMins) {
      startMins += 24 * 60;
      endMins += 24 * 60;
    }

    return startMins < openMins || endMins > closeMins;
  };
  
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const hasTimeWarnings = itineraryItems.some(isPlaceClosed);
  
  const getCategoryLabel = (cityId: string, categoryId: string) => {
    const genericType = GENERIC_PLACE_TYPES.find(pt => pt.id === categoryId);
    if (genericType) return genericType.en;

    const cityData = VIETNAM_CITIES.find(c => c.id === cityId);
    if (!cityData) return categoryId;
    const placeType = cityData.place_types?.find(pt => pt.id === categoryId);
    return placeType ? placeType.en : categoryId;
  };

  const [editingStayTimeIdx, setEditingStayTimeIdx] = useState<number | null>(null);
  const [newStayTimeMins, setNewStayTimeMins] = useState<string>("");

  const handleSaveStayTime = () => {
    if (editingStayTimeIdx === null) return;
    const mins = parseInt(newStayTimeMins, 10);
    if (isNaN(mins) || mins <= 0) {
      setEditingStayTimeIdx(null);
      return;
    }

    const newItems = [...itineraryItems];
    const newStaySecs = mins * 60;
    
    newItems[editingStayTimeIdx] = { ...newItems[editingStayTimeIdx], suggested_stay_time_secs: newStaySecs };
    
    for (let i = editingStayTimeIdx; i < newItems.length; i++) {
      if (!newItems[i].start_time || !newItems[i].end_time) {
        continue;
      }
      if (i === editingStayTimeIdx) {
        const start = new Date(newItems[i].start_time).getTime();
        if (!isNaN(start)) {
          newItems[i] = { ...newItems[i], end_time: new Date(start + newStaySecs * 1000).toISOString() };
        }
      } else {
        if (!itineraryItems[i - 1]?.end_time || !itineraryItems[i]?.start_time || !newItems[i - 1]?.end_time) {
          continue;
        }
        const prevOldEndTime = new Date(itineraryItems[i - 1].end_time).getTime();
        const thisOldStartTime = new Date(itineraryItems[i].start_time).getTime();
        const travelSecs = Math.max(0, (thisOldStartTime - prevOldEndTime) / 1000);
        
        const prevNewEndTime = new Date(newItems[i - 1].end_time).getTime();
        const staySecs = newItems[i].suggested_stay_time_secs || 3600;
        
        if (!isNaN(prevNewEndTime) && !isNaN(travelSecs)) {
          newItems[i] = { 
            ...newItems[i], 
            start_time: new Date(prevNewEndTime + travelSecs * 1000).toISOString(),
            end_time: new Date(prevNewEndTime + travelSecs * 1000 + staySecs * 1000).toISOString()
          };
        }
      }
    }
    
    setItineraryItems(newItems);
    setEditingStayTimeIdx(null);
  };

  const handleSaveTourClick = () => {
    if (hasTimeWarnings) {
      setShowTimeWarningPopup(true);
    } else {
      handleNext();
    }
  };
  const [transport, setTransport] = useState<"CAR"|"BUS"|"BIKE">("CAR");
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasUncalculatedChanges, setHasUncalculatedChanges] = useState(false);

  const [finalName, setFinalName] = useState("");

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (itineraryItems.length === 0) return;

    const paddedTime = newTime.length === 4 ? `0${newTime}` : newTime;
    let currentStartTime = new Date(`${date}T${paddedTime}`);
    const newItems = [...itineraryItems];
    
    for (let i = 0; i < newItems.length; i++) {
      if (!newItems[i].start_time) continue;
      
      const oldStartTime = new Date(itineraryItems[i].start_time).getTime();
      let travelSecs = 0;
      if (i > 0) {
         const prevOldEndTime = new Date(itineraryItems[i - 1].end_time).getTime();
         travelSecs = Math.max(0, (oldStartTime - prevOldEndTime) / 1000);
         currentStartTime = new Date(new Date(newItems[i - 1].end_time).getTime() + travelSecs * 1000);
      }
      
      newItems[i].start_time = currentStartTime.toISOString();
      const staySecs = newItems[i].suggested_stay_time_secs || 3600;
      const endTime = new Date(currentStartTime.getTime() + staySecs * 1000);
      newItems[i].end_time = endTime.toISOString();
    }
    setItineraryItems(newItems);
  };

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
        const paddedTime = time.length === 4 ? `0${time}` : time;
        const datetime = new Date(`${date}T${paddedTime}`).toISOString();
        const res = await fetch("/api/get_places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: VIETNAM_CITIES.find(c => c.id === city)?.name_en || city,
            datetime,
            place_types: selectedCategories.map(catId => getCategoryLabel(city, catId)),
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
      const cityName = VIETNAM_CITIES.find(c => c.id === city)?.name_en || city;
      const formattedDate = new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric" });
      setFinalName(`${cityName} trip, ${formattedDate}`);
      setStep(3);
    }
  };

  const handleCalculateRoutes = async () => {
    if (itineraryItems.length < 2) return;
    setIsCalculating(true);
    try {
      const routePoints = itineraryItems.map(i => ({ coords: i.maps_coords, name: i.name, address: i.address }));
      const res = await fetch("/api/get_routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: routePoints, preferred_vehicle: transport })
      });
      const travelTimes = await res.json();
      
      const paddedTime = time.length === 4 ? `0${time}` : time;
      let currentStartTime = new Date(`${date}T${paddedTime}`);
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
    
    let defaultStartTime = "";
    let defaultEndTime = "";
    const staySecs = place.suggested_stay_time_secs || 3600;

    if (itineraryItems.length === 0) {
      const paddedTime = time.length === 4 ? `0${time}` : time;
      const start = new Date(`${date}T${paddedTime}`);
      if (!isNaN(start.getTime())) {
        defaultStartTime = start.toISOString();
        defaultEndTime = new Date(start.getTime() + staySecs * 1000).toISOString();
      }
    }
    
    setItineraryItems([...itineraryItems, { 
      ...place, 
      start_time: defaultStartTime, 
      end_time: defaultEndTime,
      suggested_stay_time_secs: staySecs 
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
    const paddedTime = time.length === 4 ? `0${time}` : time;
    addItinerary({
      id: uuidv4(),
      name: finalName,
      Start_DateTime: new Date(`${date}T${paddedTime}`).toISOString(),
      City: VIETNAM_CITIES.find(c => c.id === city)?.name_en || city,
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
          <button onClick={handleBackClick} className="p-2 -ml-2 text-neutral-400 hover:text-black">
            <ChevronLeft size={24} />
          </button>
          <h1 className="ml-2 font-extrabold tracking-tight text-lg">New Tour</h1>
        </header>

        <main className="p-6 space-y-6 max-w-2xl mx-auto">
          {/* Section 1: Destination */}
          <div className={`relative z-50 p-5 rounded-xl border transition-all duration-500 ${!city ? 'border-neutral-300 shadow-[0_0_20px_rgba(156,163,175,0.4)] ring-2 ring-neutral-100 bg-white scale-[1.01]' : 'border-neutral-200 bg-neutral-50/50 opacity-80 hover:opacity-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${!city ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-500'}`}>1</div>
                <h3 className="text-base font-bold">Destination</h3>
              </div>
              <button 
                onClick={() => setShowCityInfoPopup(true)} 
                className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors"
              >
                <Info size={14} /> ABOUT CITIES
              </button>
            </div>
            
            <div className="relative" ref={cityDropdownRef}>
              <MapPin className="absolute left-4 top-3.5 text-neutral-400" size={18} />
              <div 
                className="w-full bg-white border border-neutral-200 rounded-lg py-3 pl-12 pr-4 text-base font-medium cursor-pointer hover:border-neutral-300 transition-colors"
                onClick={() => setIsCityDropdownOpen(true)}
              >
                {VIETNAM_CITIES.find(c => c.id === city)?.name_en || <span className="text-neutral-400">Select a city</span>}
              </div>
              
              {isCityDropdownOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-60 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-neutral-100 shrink-0">
                     <input 
                       type="text" 
                       placeholder="Search city..." 
                       value={citySearchQuery}
                       onChange={(e) => setCitySearchQuery(e.target.value)}
                       className="w-full bg-neutral-100 px-3 py-2 rounded-md text-sm focus:outline-none"
                       autoFocus
                     />
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {VIETNAM_CITIES.filter(c => 
                       c.name_en.toLowerCase().includes(citySearchQuery.toLowerCase()) || 
                       c.name_vi.toLowerCase().includes(citySearchQuery.toLowerCase())
                    ).map(c => (
                      <div 
                        key={c.id} 
                        className="px-4 py-3 hover:bg-neutral-50 cursor-pointer text-sm border-b border-neutral-50 last:border-0"
                        onClick={() => {
                           setCity(c.id);
                           setSelectedCategories([]);
                           setIsCityDropdownOpen(false);
                           setCitySearchQuery("");
                        }}
                      >
                        <span className="font-semibold">{c.name_en}</span>
                      </div>
                    ))}
                    {VIETNAM_CITIES.filter(c => 
                       c.name_en.toLowerCase().includes(citySearchQuery.toLowerCase()) || 
                       c.name_vi.toLowerCase().includes(citySearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="px-4 py-4 text-sm text-neutral-500 text-center">No city found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Date */}
          <div className={`p-5 rounded-xl border transition-all duration-500 ${city && !date ? 'border-neutral-300 shadow-[0_0_20px_rgba(156,163,175,0.4)] ring-2 ring-neutral-100 bg-white scale-[1.01]' : 'border-neutral-200 bg-neutral-50/50 opacity-80 hover:opacity-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${city && !date ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-500'}`}>2</div>
              <h3 className="text-base font-bold">Date</h3>
            </div>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-lg py-3 px-4 text-base font-medium focus:outline-none focus:border-neutral-400 hover:border-neutral-300 transition-colors"
            />
          </div>

          {/* Section 3: Interests & Preferences */}
          <div className={`p-5 rounded-xl border transition-all duration-500 ${city && date && selectedCategories.length === 0 ? 'border-neutral-300 shadow-[0_0_20px_rgba(156,163,175,0.4)] ring-2 ring-neutral-100 bg-white scale-[1.01]' : 'border-neutral-200 bg-neutral-50/50 opacity-80 hover:opacity-100'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${city && date && selectedCategories.length === 0 ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-500'}`}>3</div>
              <h3 className="text-base font-bold">Interests & Details</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Places</label>
                <div className="flex flex-wrap gap-2">
                  {city ? (
                    <>
                      {VIETNAM_CITIES.find(c => c.id === city)?.place_types?.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            if (selectedCategories.includes(cat.id)) {
                              setSelectedCategories(selectedCategories.filter(c => c !== cat.id));
                            } else {
                              setSelectedCategories([...selectedCategories, cat.id]);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                            selectedCategories.includes(cat.id) 
                              ? "border-black bg-black text-white shadow-sm" 
                              : "border-neutral-200 text-neutral-600 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                          }`}
                        >
                          {cat.en}
                        </button>
                      ))}
                      
                      {showMorePlaces && GENERIC_PLACE_TYPES.filter(
                        cat => !VIETNAM_CITIES.find(c => c.id === city)?.place_types?.some(pt => pt.id === cat.id)
                      ).map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            if (selectedCategories.includes(cat.id)) {
                              setSelectedCategories(selectedCategories.filter(c => c !== cat.id));
                            } else {
                              setSelectedCategories([...selectedCategories, cat.id]);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                            selectedCategories.includes(cat.id) 
                              ? "border-black bg-black text-white shadow-sm" 
                              : "border-neutral-200 text-neutral-600 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                          }`}
                        >
                          {cat.en}
                        </button>
                      ))}

                      <button
                        onClick={() => setShowMorePlaces(!showMorePlaces)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-neutral-200 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-all flex items-center gap-1"
                      >
                        {showMorePlaces ? "Show less" : "More places..."}
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-neutral-500">Please select a city first to view available places.</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Preferences</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 hover:border-neutral-300 transition-colors">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${prefChildrenFriendly ? 'bg-black border-black' : 'border-2 border-neutral-300'}`}>
                      {prefChildrenFriendly && <Check size={14} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={prefChildrenFriendly} onChange={() => setPrefChildrenFriendly(!prefChildrenFriendly)} />
                    <span className="font-semibold text-sm text-neutral-800">Child-friendly</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 hover:border-neutral-300 transition-colors">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${prefAccessible ? 'bg-black border-black' : 'border-2 border-neutral-300'}`}>
                      {prefAccessible && <Check size={14} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={prefAccessible} onChange={() => setPrefAccessible(!prefAccessible)} />
                    <span className="font-semibold text-sm text-neutral-800">Accessible</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 hover:border-neutral-300 transition-colors sm:col-span-2">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${prefLesserKnown ? 'bg-black border-black' : 'border-2 border-neutral-300'}`}>
                      {prefLesserKnown && <Check size={14} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={prefLesserKnown} onChange={() => setPrefLesserKnown(!prefLesserKnown)} />
                    <span className="font-semibold text-sm text-neutral-800">Lesser known places</span>
                  </label>
                </div>
              </div>
            </div>
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
              disabled={!city || !date || selectedCategories.length === 0 || isLoading}
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

        {/* Discard Popup */}
        {showDiscardPopup && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl flex flex-col p-6">
              <h2 className="font-bold text-xl mb-2 text-neutral-900">Discard itinerary?</h2>
              <p className="text-neutral-500 mb-6 leading-relaxed">Are you sure you want to go back? Your current itinerary and generated suggestions will be lost.</p>
              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setShowDiscardPopup(false)} 
                  className="flex-1 py-3 px-4 bg-neutral-100 text-neutral-900 font-medium rounded-md hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => router.push("/view/main")} 
                  className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
        {/* City Info Popup (About Cities) */}
        {showCityInfoPopup && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between p-4 border-b border-neutral-100 shrink-0">
                <h2 className="font-bold text-lg">About Cities</h2>
                <button onClick={() => setShowCityInfoPopup(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 border-b border-neutral-100 shrink-0">
                 <input 
                   type="text" 
                   placeholder="Search by city name or information..." 
                   value={cityInfoSearchQuery}
                   onChange={(e) => setCityInfoSearchQuery(e.target.value)}
                   className="w-full bg-neutral-100 px-4 py-2 rounded-lg text-sm focus:outline-none"
                   autoFocus
                 />
              </div>
              <div className="p-4 overflow-y-auto flex flex-col gap-6 flex-1">
                {VIETNAM_CITIES.filter(c => 
                   c.name_en.toLowerCase().includes(cityInfoSearchQuery.toLowerCase()) || 
                   c.name_vi.toLowerCase().includes(cityInfoSearchQuery.toLowerCase()) ||
                   c.tourist_summary_en.toLowerCase().includes(cityInfoSearchQuery.toLowerCase()) ||
                   c.tourist_summary_vi.toLowerCase().includes(cityInfoSearchQuery.toLowerCase())
                ).map(c => (
                  <div key={c.id} className="flex flex-col gap-2 border-b border-neutral-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-bold text-lg">{c.name_en}</h3>
                      <button
                        onClick={() => {
                          setCity(c.id);
                          setShowCityInfoPopup(false);
                          setCityInfoSearchQuery("");
                        }}
                        className="bg-black text-white p-2.5 rounded-full hover:bg-neutral-800 transition-colors shrink-0 flex items-center justify-center"
                        title="Select this city"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {c.tourist_summary_en}
                    </p>
                  </div>
                ))}
                {VIETNAM_CITIES.filter(c => 
                   c.name_en.toLowerCase().includes(cityInfoSearchQuery.toLowerCase()) || 
                   c.name_vi.toLowerCase().includes(cityInfoSearchQuery.toLowerCase()) ||
                   c.tourist_summary_en.toLowerCase().includes(cityInfoSearchQuery.toLowerCase()) ||
                   c.tourist_summary_vi.toLowerCase().includes(cityInfoSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 text-neutral-500 text-sm">No matches found.</div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="h-[100dvh] bg-white text-neutral-900 flex flex-col font-sans overflow-hidden">
        <header className="h-16 px-4 flex items-center bg-white border-b border-neutral-100 shrink-0">
          <button onClick={handleBackClick} className="p-2 -ml-2 text-neutral-400 hover:text-black">
            <ChevronLeft size={24} />
          </button>
          <div className="ml-2">
            <h1 className="font-extrabold tracking-tight text-lg">Plan Itinerary</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full overflow-hidden">
          {/* Start Time Configurator */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0 z-10 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-neutral-800">Tour Start Time</h2>
              <p className="text-xs text-neutral-500">Adjust when your day begins</p>
            </div>
            <input 
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-md py-2 px-3 text-sm font-medium focus:outline-none focus:border-neutral-300"
            />
          </div>

          {/* Pending Itinerary */}
          <div className="flex-1 overflow-y-auto p-4 bg-white relative">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Your Itinerary ({itineraryItems.length}/10)</h2>
            
            {itineraryItems.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <p>Select places from below to add to your tour.</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {itineraryItems.map((item, idx) => {
                  const isClosed = isPlaceClosed(item);
                  return (
                  <div key={item.maps_place_id || `itinerary-${idx}`} className={`p-4 rounded-xl border flex items-center gap-4 ${isClosed ? "bg-yellow-50 border-yellow-200" : "bg-neutral-50 border-neutral-100"}`}>
                    <div className={`flex flex-col gap-1 ${isClosed ? "text-yellow-700/50" : "text-neutral-400"}`}>
                      <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="hover:text-black"><ChevronLeft className="rotate-90" size={20} /></button>
                      <button onClick={() => moveItem(idx, 1)} disabled={idx === itineraryItems.length - 1} className="hover:text-black"><ChevronLeft className="-rotate-90" size={20} /></button>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base leading-tight">{item.name}</h3>
                      <div className={`flex justify-between mt-2 text-sm font-medium ${isClosed ? "text-yellow-800" : "text-neutral-600"}`}>
                        <span className={`px-2 py-1 rounded border ${isClosed ? "bg-yellow-100/50 border-yellow-200" : "bg-white border-neutral-200"}`}>{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                        <button 
                          onClick={() => { setEditingStayTimeIdx(idx); setNewStayTimeMins(String(Math.round((item.suggested_stay_time_secs || 3600) / 60))); }}
                          className={`px-2 py-1 rounded border flex items-center gap-1 hover:bg-black/5 transition-colors ${isClosed ? "bg-yellow-100/50 border-yellow-200" : "bg-white border-neutral-200"}`}
                        >
                          {Math.round((item.suggested_stay_time_secs || 3600) / 60)} mins
                          <Edit2 size={12} />
                        </button>
                      </div>
                      {isClosed && (
                        <div className="mt-2 text-xs font-semibold text-yellow-700">
                          Warning: Outside opening hours ({item.opening_time})
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeFromItinerary(idx)} className={`p-2 rounded-md shrink-0 ${isClosed ? "text-yellow-700 hover:bg-yellow-100" : "text-red-500 hover:bg-red-50"}`}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                )})}
              </div>
            )}
          </div>
          
          {/* Suggestions & Bottom controls Combined */}
          <div className="shrink-0 flex flex-col bg-white border-t border-neutral-200 z-10 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]">
            <div className="p-4 pb-2">
              <div className="flex justify-between items-center mb-3 px-1">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Suggestions</h2>
                <button 
                  onClick={() => setShowInfoPopup(true)} 
                  className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors"
                >
                  <Info size={14} /> INFO
                </button>
              </div>
              <div className="flex overflow-x-scroll gap-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {candidates.map((c, idx) => (
                  <div key={c.local_id || `candidate-${idx}`} className="bg-white border border-neutral-200 rounded-xl p-3 flex flex-col gap-2 min-w-[260px] w-[260px] snap-start shrink-0 shadow-sm">
                    <div className="flex flex-col gap-0.5 w-full">
                      <div className="flex items-start justify-between gap-3 w-full">
                        <h3 className="font-semibold text-sm flex-1 line-clamp-2 mt-1">{c.name}</h3>
                        <button 
                          onClick={() => addToItinerary(c)}
                          disabled={itineraryItems.length >= 10}
                          className="py-2 px-3 bg-black text-white rounded-md hover:bg-neutral-800 disabled:opacity-50 shrink-0 flex items-center justify-center"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-neutral-500 truncate mt-1">{getCategoryLabel(city, c.category)} • {c.is_outdoor ? "Outdoor" : "Indoor"}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-100 px-1.5 py-0.5 rounded text-xs font-semibold text-neutral-500 w-max">
                          <span>★</span>
                          <span className="text-neutral-900">{c.rating}</span>
                          <span>({c.rate_count})</span>
                        </div>
                        {c.opening_time && (
                          <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-100 px-1.5 py-0.5 rounded text-xs font-semibold text-neutral-500 w-max">
                            <span>{c.opening_time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="p-4 space-y-3 shrink-0">
              <div className="flex gap-2">
                {(["CAR", "BUS", "BIKE"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTransport(t); setHasUncalculatedChanges(true); }}
                    className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest rounded-md border transition-colors ${transport === t ? "bg-black border-black text-white" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}
                  >
                    {t === "CAR" && <Car size={14} />}
                    {t === "BUS" && <Bus size={14} />}
                    {t === "BIKE" && <Bike size={14} />}
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCalculateRoutes}
                  disabled={!hasUncalculatedChanges || itineraryItems.length < 2 || isCalculating}
                  className={`flex-1 py-3 rounded-md font-medium disabled:opacity-50 transition-all ${hasUncalculatedChanges && itineraryItems.length >= 2 ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.5)] ring-2 ring-blue-400 hover:bg-blue-100" : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"}`}
                >
                  {isCalculating ? "Calculating..." : "Recalculate Itinerary"}
                </button>
                <button
                  onClick={handleSaveTourClick}
                  disabled={itineraryItems.length === 0 || hasUncalculatedChanges}
                  className="flex-1 py-3 bg-black text-white rounded-md font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  {hasTimeWarnings && <AlertTriangle size={18} className="text-yellow-400" />} Save Tour
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Stay Time Popup */}
        {editingStayTimeIdx !== null && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xs rounded-2xl shadow-xl flex flex-col p-6">
              <h2 className="font-bold text-xl mb-4 text-neutral-900 text-center">Edit Stay Time</h2>
              <div className="flex items-center gap-2 mb-6 justify-center">
                <input 
                  type="number" 
                  min="1"
                  value={newStayTimeMins} 
                  onChange={(e) => setNewStayTimeMins(e.target.value)} 
                  className="w-24 border border-neutral-200 rounded-md py-2 px-3 text-center font-semibold focus:outline-none focus:border-black"
                />
                <span className="font-semibold text-neutral-500">mins</span>
              </div>
              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setEditingStayTimeIdx(null)} 
                  className="flex-1 py-3 px-4 bg-neutral-100 text-neutral-900 font-medium rounded-md hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveStayTime} 
                  className="flex-1 py-3 px-4 bg-black text-white font-medium rounded-md hover:bg-neutral-800 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Time Warning Popup */}
        {showTimeWarningPopup && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl flex flex-col p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="text-yellow-500" size={24} />
                <h2 className="font-bold text-xl text-neutral-900">Time Warning</h2>
              </div>
              <p className="text-neutral-500 mb-6 leading-relaxed">Some places in your itinerary are scheduled outside of their regular opening hours. Do you want to proceed anyway?</p>
              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setShowTimeWarningPopup(false)} 
                  className="flex-1 py-3 px-4 bg-neutral-100 text-neutral-900 font-medium rounded-md hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { setShowTimeWarningPopup(false); handleNext(); }} 
                  className="flex-1 py-3 px-4 bg-black text-white font-medium rounded-md hover:bg-neutral-800 transition-colors"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Popup */}
        {showInfoPopup && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                <h2 className="font-bold text-lg">Places Information</h2>
                <button onClick={() => setShowInfoPopup(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex flex-col gap-6 flex-1">
                {candidates.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">No places available.</p>
                ) : (
                  candidates.map((c, idx) => (
                    <div key={`info-${c.local_id || idx}`} className="flex flex-col gap-2 border-b border-neutral-100 pb-4 last:border-b-0 last:pb-0">
                      <h3 className="font-bold text-lg">{c.name}</h3>
                      <p className="text-sm text-neutral-600 leading-relaxed">{c.introduction || "No description available."}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        {/* Discard Popup for Step 2 */}
        {showDiscardPopup && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl flex flex-col p-6">
              <h2 className="font-bold text-xl mb-2 text-neutral-900">Discard itinerary?</h2>
              <p className="text-neutral-500 mb-6 leading-relaxed">Are you sure you want to go back? Your current itinerary and generated suggestions will be lost.</p>
              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setShowDiscardPopup(false)} 
                  className="flex-1 py-3 px-4 bg-neutral-100 text-neutral-900 font-medium rounded-md hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => router.push("/view/main")} 
                  className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
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
        
        {/* Share functionality is temporarily disabled/hidden */}
        {/* <button
          onClick={() => {}}
          className="w-full py-3 bg-white text-neutral-900 border border-neutral-200 rounded-md font-medium text-lg flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
        >
          <Share size={20} /> Export / Share
        </button> */}
      </div>
    </div>
  )
}
