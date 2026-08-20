"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Search, Calendar, ExternalLink, Loader2, Info, X, CheckCircle2, Share, AlertTriangle, ArrowDown, Clock, Settings, Bus, Car, Bike, ArrowUp, Trash2, Edit2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";
import { Place, ItineraryItem, Itinerary } from "@/lib/types";
import { VIETNAM_CITIES } from "@/lib/cities";

const EVENT_CATEGORIES = [
  "Sports Events",
  "Traditional / Folk Festivals",
  "Culinary Fairs",
  "Live Cultural / Nighttime Shows",
  "Craft Workshops",
  "Expos",
  "Concerts",
  "Other"
];

export interface EventParticipation {
  id: string; // assigned locally
  date: number; // timestamp
  time_start: string;
  time_end: string;
  city: string;
  address_line: string;
}

export interface EventItem {
  id: string;
  name: string;
  description: string;
  participations: EventParticipation[];
}

export default function NewEventItinerary() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [city, setCity] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [monthFrom, setMonthFrom] = useState("");
  const [monthTo, setMonthTo] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedParticipationIds, setSelectedParticipationIds] = useState<string[]>([]);
  const [globalSources, setGlobalSources] = useState<string[]>([]);
  const { addItinerary } = useStore();
  
  // Step 4 state
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [transport, setTransport] = useState<"CAR"|"BUS"|"BIKE">("CAR");
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasUncalculatedChanges, setHasUncalculatedChanges] = useState(false);
  const [finalName, setFinalName] = useState("");
  const [editingStayTimeIdx, setEditingStayTimeIdx] = useState<number | null>(null);
  const [newStayTimeMins, setNewStayTimeMins] = useState<string>("");
  const [showTimeWarningPopup, setShowTimeWarningPopup] = useState(false);
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);

  // UI state for dropdowns
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
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

  const handleBackClick = () => {
    if (events.length > 0 || step > 1) {
      setShowDiscardPopup(true);
    } else {
      router.push("/view/main");
    }
  };

  const handleSearch = async () => {
    if (!city || selectedCategories.length === 0) return;
    
    setIsLoading(true);
    setErrorMsg("");
    try {
      const cityName = VIETNAM_CITIES.find(c => c.id === city)?.name_en || city;
      const res = await fetch("/api/search_events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityName,
          categories: selectedCategories,
          monthFrom,
          monthTo
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Failed to find events.");
        return;
      }
      
      const loadedEvents = data.events || [];
      const loadedSources = data.global_sources || [];
      // Assign local IDs
      setEvents(loadedEvents.map((e: any, i: number) => ({ 
        ...e, 
        id: `evt-${i}`,
        participations: (e.participations || []).map((p: any, j: number) => ({
          ...p,
          id: `evt-${i}-part-${j}`
        }))
      })));
      setGlobalSources(loadedSources);
      setSelectedParticipationIds([]);
      setStep(2);
    } catch (e) {
      console.error(e);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedParticipations = () => {
    const selected: EventParticipation[] = [];
    events.forEach(e => {
      e.participations.forEach(p => {
        if (selectedParticipationIds.includes(p.id)) {
          selected.push(p);
        }
      });
    });
    return selected;
  };

  const getFirstSelected = () => {
    return getSelectedParticipations()[0];
  };

  const isParticipationLocked = (part: EventParticipation) => {
    if (selectedParticipationIds.length === 0) return false;
    if (selectedParticipationIds.includes(part.id)) return false;

    const first = getFirstSelected();
    if (!first) return false;
    
    // Lock out if different city
    if (part.city !== first.city) return true;
    
    // Lock out if different date (using localized date string for day comparison)
    if (new Date(part.date).toDateString() !== new Date(first.date).toDateString()) return true;

    return false;
  };

  const handleStep2Continue = () => {
    // map selected events to ItineraryItem
    const selectedItems = selectedParticipationIds.map(pid => {
      // pid is like "evt-0-part-0"
      const [_, evtIdx, __, partIdx] = pid.split('-');
      const evt = events[parseInt(evtIdx)];
      const part = evt.participations[parseInt(partIdx)];
      
      const parseTime = (t: string) => {
        const [h, m] = (t || "00:00").split(':').map(Number);
        return h * 60 + m;
      };
      
      const staySecs = (parseTime(part.time_end) - parseTime(part.time_start)) * 60;
      
      return {
        local_id: pid,
        name: evt.name,
        maps_place_id: "",
        maps_coords: "",
        address: `${part.address_line}, ${part.city}`,
        opening_time: `${part.time_start} - ${part.time_end}`,
        rating: 0,
        rate_count: 0,
        introduction: evt.description,
        category: "Event",
        is_outdoor: false,
        suggested_stay_time_secs: staySecs > 0 ? staySecs : 7200,
        start_time: "",
        end_time: ""
      } as ItineraryItem;
    });
    
    if (selectedItems.length > 0) {
      const firstEvtPartId = selectedParticipationIds[0];
      const [_, eI, __, pI] = firstEvtPartId.split('-');
      const d = new Date(events[parseInt(eI)].participations[parseInt(pI)].date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const newDateStr = `${yyyy}-${mm}-${dd}`;
      setDate(newDateStr);
      
      const timeStart = events[parseInt(eI)].participations[parseInt(pI)].time_start;
      if (timeStart) {
        setTime(timeStart);
        if (selectedItems.length === 1) {
           setItineraryItems(recalculateLocal(selectedItems, newDateStr, timeStart));
           setHasUncalculatedChanges(false);
        } else {
           setItineraryItems(selectedItems);
           setHasUncalculatedChanges(true);
        }
      } else {
        if (selectedItems.length === 1) {
           setItineraryItems(recalculateLocal(selectedItems, newDateStr, time));
           setHasUncalculatedChanges(false);
        } else {
           setItineraryItems(selectedItems);
           setHasUncalculatedChanges(true);
        }
      }
    } else {
      setItineraryItems(selectedItems);
      setHasUncalculatedChanges(false);
    }
    
    setStep(3);
  };
  const hasTimeWarnings = itineraryItems.some(i => checkEventTiming(i)?.isWarning);

  const recalculateLocal = (items: ItineraryItem[], dateStrArg: string, startTimeStr: string) => {
    const paddedTime = startTimeStr.length === 4 ? `0${startTimeStr}` : startTimeStr;
    const d = dateStrArg || date || new Date().toISOString().split('T')[0];
    let currentStartTime = new Date(`${d}T${paddedTime}`);
    const newItems = [...items];
    for (let i = 0; i < newItems.length; i++) {
      newItems[i].start_time = currentStartTime.toISOString();
      const staySecs = newItems[i].suggested_stay_time_secs || 3600;
      const endTime = new Date(currentStartTime.getTime() + staySecs * 1000);
      newItems[i].end_time = endTime.toISOString();
      if (i < newItems.length - 1) {
        let travelSecs = 1800;
        if (newItems[i].transit_instruction) {
          const t = parseInt(newItems[i].transit_instruction || "1800");
          if (!isNaN(t)) travelSecs = t;
        }
        currentStartTime = new Date(endTime.getTime() + travelSecs * 1000);
      }
    }
    return newItems;
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (itineraryItems.length > 0 && !hasUncalculatedChanges) {
       setItineraryItems(recalculateLocal(itineraryItems, date, newTime));
    } else {
       setHasUncalculatedChanges(true);
    }
  };

  const handleSaveStayTime = () => {
    if (editingStayTimeIdx === null) return;
    const mins = parseInt(newStayTimeMins, 10);
    if (isNaN(mins) || mins <= 0) {
      setEditingStayTimeIdx(null);
      return;
    }

    const newItems = [...itineraryItems];
    newItems[editingStayTimeIdx].suggested_stay_time_secs = mins * 60;
    
    if (!hasUncalculatedChanges) {
      setItineraryItems(recalculateLocal(newItems, date, time));
    } else {
      setItineraryItems(newItems);
      setHasUncalculatedChanges(true);
    }
    setEditingStayTimeIdx(null);
  };

  const handleCalculateRoutes = async () => {
    if (itineraryItems.length === 0) return;
    setIsCalculating(true);
    try {
      const paddedTime = time.length === 4 ? `0${time}` : time;
      const d = date || new Date().toISOString().split('T')[0];
      let currentStartTime = new Date(`${d}T${paddedTime}`);
      const newItems = [...itineraryItems];
      let travelTimes: Record<string, { duration: number; instruction: string }> = {};

      if (newItems.length >= 2) {
        const routePoints = newItems.map(i => ({ coords: i.maps_coords, name: i.name, address: i.address }));
        const res = await fetch("/api/get_routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points: routePoints, preferred_vehicle: transport })
        });
        travelTimes = await res.json();
      }

      for (let i = 0; i < newItems.length; i++) {
        newItems[i].start_time = currentStartTime.toISOString();
        const staySecs = newItems[i].suggested_stay_time_secs || 3600;
        const endTime = new Date(currentStartTime.getTime() + staySecs * 1000);
        newItems[i].end_time = endTime.toISOString();
        
        if (i < newItems.length - 1) {
          const key1 = newItems[i].maps_coords || newItems[i].address || newItems[i].name;
          const key2 = newItems[i+1].maps_coords || newItems[i+1].address || newItems[i+1].name;
          const key = `${key1}_${key2}`;
          const routeData = travelTimes[key] || { duration: parseInt(newItems[i].transit_instruction || "1800") || 1800, instruction: newItems[i].transit_instruction || "" };
          const travelSecs = routeData.duration;
          newItems[i].transit_instruction = routeData.instruction || travelSecs.toString();
          
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

  const formatTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const removeFromItinerary = (index: number) => {
    const newItems = [...itineraryItems];
    newItems.splice(index, 1);
    if (newItems.length === 1) {
       setItineraryItems(recalculateLocal(newItems, date, time));
       setHasUncalculatedChanges(false);
    } else {
       setItineraryItems(newItems);
       setHasUncalculatedChanges(true);
    }
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

  const handleSaveTourClick = () => {
    if (hasTimeWarnings) {
      setShowTimeWarningPopup(true);
    } else {
      setStep(5);
    }
  };

  const handleSave = () => {
    const paddedTime = time.length === 4 ? `0${time}` : time;
    const d = date || new Date().toISOString().split('T')[0];
    addItinerary({
      id: uuidv4(),
      name: finalName || "My Event Tour",
      Start_DateTime: new Date(`${d}T${paddedTime}`).toISOString(),
      City: VIETNAM_CITIES.find(c => c.id === city)?.name_en || city,
      transport,
      items: itineraryItems
    });
    router.push("/view/main");
  };
  function checkEventTiming(item: ItineraryItem) {
    if (!item.opening_time || !item.start_time || !item.end_time || item.category !== "Event") return null;
    const match = item.opening_time.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (!match) return null;
    
    const [_, open, close] = match;
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    
    const evtStart = parseTime(open);
    const evtEnd = parseTime(close);
    
    const parseIsoTime = (iso: string) => {
      const d = new Date(iso);
      return d.getHours() * 60 + d.getMinutes();
    };
    
    const arrTime = parseIsoTime(item.start_time);
    const depTime = parseIsoTime(item.end_time);
    
    let isWarning = false;
    let nudgeEarlyArrive = false;
    let nudgeEarlyLeave = false;
    
    if (arrTime > evtStart + 15) {
       isWarning = true;
    } else if (arrTime < evtStart - 15) {
       nudgeEarlyArrive = true;
    }
    
    if (depTime < evtEnd - 15) {
       nudgeEarlyLeave = true;
    }
    
    return { isWarning, nudgeEarlyArrive, nudgeEarlyLeave };
  };
  const parseTimeStr = (dateTs: number, timeStr: string) => {
    const d = new Date(dateTs);
    const [hours, minutes] = (timeStr || "00:00").split(':').map(Number);
    d.setHours(hours || 0, minutes || 0, 0, 0);
    return d.getTime();
  };

  const hasOverlapWarning = () => {
    const selected = getSelectedParticipations();
    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const p1 = selected[i];
        const p2 = selected[j];
        const start1 = parseTimeStr(p1.date, p1.time_start);
        const end1 = parseTimeStr(p1.date, p1.time_end);
        const start2 = parseTimeStr(p2.date, p2.time_start);
        const end2 = parseTimeStr(p2.date, p2.time_end);

        if (start1 < end2 && start2 < end1) {
          return true;
        }
      }
    }
    return false;
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col h-screen overflow-hidden">
        <header className="h-16 px-4 shrink-0 flex items-center border-b border-neutral-100 bg-white z-10">
          <button onClick={handleBackClick} className="p-2 -ml-2 text-neutral-400 hover:text-black">
            <ChevronLeft size={24} />
          </button>
          <h1 className="ml-2 font-extrabold tracking-tight text-lg">Find Events</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-neutral-50/50">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Section 1: Destination */}
          <div className="p-5 rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">1</div>
              <h3 className="text-base font-bold">Destination</h3>
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
                        className="px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-50 last:border-b-0"
                        onClick={() => { setCity(c.id); setIsCityDropdownOpen(false); }}
                      >
                        <span className="font-medium block">{c.name_en}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1">From (Optional)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                  <input 
                    type="month"
                    value={monthFrom}
                    onChange={(e) => setMonthFrom(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-neutral-300 transition-colors"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1">To (Optional)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                  <input 
                    type="month"
                    value={monthTo}
                    onChange={(e) => setMonthTo(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-neutral-300 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Event Categories */}
          <div className={`p-5 rounded-xl border transition-all duration-500 ${!city ? 'border-neutral-200 bg-neutral-50/50 opacity-50 pointer-events-none' : 'border-neutral-200 bg-white shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${!city ? 'bg-neutral-200 text-neutral-500' : 'bg-black text-white'}`}>2</div>
              <h3 className="text-base font-bold">Categories</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategories(selectedCategories.filter(c => c !== cat));
                      } else {
                        setSelectedCategories([...selectedCategories, cat]);
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected ? "bg-black text-white ring-2 ring-black ring-offset-1" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm text-center font-medium border border-red-100">
                {errorMsg}
              </div>
            )}
            <button
              onClick={handleSearch}
              disabled={!city || selectedCategories.length === 0 || isLoading}
              className="w-full py-3 px-6 bg-black text-white rounded-md font-medium text-lg disabled:opacity-50 flex justify-center items-center gap-2 hover:bg-neutral-800 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Searching events...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Search
                </>
              )}
            </button>
          </div>
          </div>
        </main>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col h-screen overflow-hidden">
        <header className="h-16 px-4 shrink-0 flex items-center border-b border-neutral-100 bg-white">
          <button onClick={handleBackClick} className="p-2 -ml-2 text-neutral-400 hover:text-black">
            <ChevronLeft size={24} />
          </button>
          <h1 className="ml-2 font-extrabold tracking-tight text-lg">Select Events</h1>
        </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50/50">
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-neutral-500 font-medium mb-2">
            Found {events.length} event(s) matching your criteria.
          </p>
          
          {events.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
              <p className="text-neutral-500 font-medium">No events found for this selection.</p>
            </div>
          )}

          {events.map((event) => {
            return (
              <div key={event.id} className="mb-6 bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-neutral-900 leading-tight mb-2">
                      {event.name}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed mb-4 line-clamp-3">
                      {event.description}
                    </p>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-neutral-800">Participation Options</h4>
                      {event.participations && event.participations.map((part) => {
                        const isLocked = isParticipationLocked(part);
                        const isSelected = selectedParticipationIds.includes(part.id);
                        return (
                          <div
                            key={part.id}
                            className={`relative p-4 rounded-lg border transition-all ${
                              isLocked 
                                ? "opacity-50 border-neutral-200 bg-neutral-50 grayscale cursor-not-allowed" 
                                : isSelected 
                                  ? "border-black ring-1 ring-black bg-white shadow-sm" 
                                  : "border-neutral-200 bg-white hover:border-neutral-300 cursor-pointer"
                            }`}
                            onClick={() => {
                              if (!isLocked) {
                                if (isSelected) {
                                  setSelectedParticipationIds(selectedParticipationIds.filter(id => id !== part.id));
                                } else {
                                  setSelectedParticipationIds([...selectedParticipationIds, part.id]);
                                }
                              }
                            }}
                          >
                            <div className="flex gap-3">
                              <div className="pt-1 shrink-0">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                  isSelected ? "bg-black border-black text-white" : "border-neutral-300 bg-white"
                                }`}>
                                  {isSelected && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 text-sm text-neutral-800 font-medium mb-1">
                                  <Calendar size={14} className="text-neutral-500" />
                                  <span>
                                    {new Date(part.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                  </span>
                                  <span className="text-neutral-400">•</span>
                                  <span>{part.time_start} - {part.time_end}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-neutral-600">
                                  <MapPin size={14} className="shrink-0 text-neutral-400 mt-0.5" />
                                  <span>{part.address_line}, {part.city}</span>
                                </div>
                              </div>
                            </div>
                            {isLocked && (
                              <div className="absolute top-2 right-2 bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                Unavailable
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {globalSources.length > 0 && (
            <div className="mt-8 p-5 bg-neutral-100 rounded-xl border border-neutral-200">
              <h4 className="font-semibold text-sm text-neutral-800 mb-3 flex items-center gap-2">
                <ExternalLink size={16} className="text-neutral-500" />
                Information Sources
              </h4>
              <ul className="space-y-2">
                {globalSources.map((url, idx) => (
                  <li key={idx}>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      {hasOverlapWarning() && (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 text-amber-800 flex gap-3 text-sm items-start shrink-0">
          <Info className="shrink-0 mt-0.5 text-amber-600" size={18} />
          <p className="font-medium">
            Warning: You have selected overlapping events. You might not be able to attend the event(s) in its full length and some events may have policies preventing late check-ins.
          </p>
        </div>
      )}
      <footer className="shrink-0 p-4 border-t border-neutral-100 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-500">
            {selectedParticipationIds.length} option(s) selected
          </p>
          <button 
            disabled={selectedParticipationIds.length === 0}
            onClick={handleStep2Continue}
            className={`py-3 px-6 rounded-md font-medium text-base transition-colors flex items-center gap-2 ${
              selectedParticipationIds.length === 0 ? "bg-neutral-200 text-neutral-400" : "bg-black text-white hover:bg-neutral-800"
            }`}
          >
            {hasOverlapWarning() && <Info size={18} className="text-amber-400" />}
            Continue
          </button>
        </div>
      </footer>

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
    </div>
  );
  }

  if (step === 3) {
    return (
      <div className="h-[100dvh] bg-white text-neutral-900 flex flex-col font-sans overflow-hidden items-center justify-center">
        <header className="h-16 px-4 flex items-center bg-white border-b border-neutral-100 shrink-0 w-full absolute top-0">
          <button onClick={() => setStep(2)} className="p-2 -ml-2 text-neutral-400 hover:text-black">
            <ChevronLeft size={24} />
          </button>
          <div className="ml-2">
            <h1 className="font-extrabold tracking-tight text-lg">Add Side Attractions?</h1>
          </div>
        </header>

        <div className="max-w-md mx-auto text-center p-6 mt-16">
          <h2 className="text-2xl font-bold mb-4">Add side attractions?</h2>
          <p className="text-neutral-500 mb-8">Explore {VIETNAM_CITIES.find(c => c.id === city)?.name_en || city} at your own pace.</p>
          <div className="flex flex-col gap-4">
            <button 
              disabled
              className="py-4 px-6 bg-black text-white font-semibold rounded-lg flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
            >
              Yes
            </button>
            <button 
              onClick={() => setStep(4)}
              className="py-4 px-6 bg-neutral-100 text-neutral-900 font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
            >
              No
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="h-[100dvh] bg-white text-neutral-900 flex flex-col font-sans overflow-hidden">
        <header className="h-16 px-4 flex items-center bg-white border-b border-neutral-100 shrink-0">
          <button onClick={() => setStep(3)} className="p-2 -ml-2 text-neutral-400 hover:text-black">
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
              onChange={handleTimeChange}
              className="bg-neutral-50 border border-neutral-200 rounded-md py-2 px-3 text-sm font-medium focus:outline-none focus:border-neutral-300"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-white relative">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Your Itinerary</h2>
            
            <div className="space-y-3 pb-4">
              {itineraryItems.map((item, idx) => {
                const evtTiming = checkEventTiming(item);
                const isClosed = evtTiming?.isWarning;
                
                return (
                  <div key={`${item.local_id}-${idx}`} className="flex flex-col gap-2 relative">
                    <div className={`p-4 rounded-xl border flex items-center gap-4 ${isClosed ? "bg-yellow-50 border-yellow-200" : "bg-neutral-50 border-neutral-100"}`}>
                      <div className={`flex flex-col gap-1 ${isClosed ? "text-yellow-700/50" : "text-neutral-400"}`}>
                        <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="hover:text-black"><ChevronLeft className="rotate-90" size={20} /></button>
                        <button onClick={() => moveItem(idx, 1)} disabled={idx === itineraryItems.length - 1} className="hover:text-black"><ChevronLeft className="-rotate-90" size={20} /></button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base leading-tight truncate">{item.name}</h3>
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

                        {evtTiming?.isWarning && (
                          <div className="mt-2 text-xs font-semibold text-yellow-700">
                            Warning: You arrive late. Please check the event&apos;s policy regarding late check-ins.
                          </div>
                        )}
                        {evtTiming?.nudgeEarlyArrive && !evtTiming.isWarning && (
                          <div className="mt-2 text-xs text-neutral-500">
                            You arrive early. Explore nearby spots before the main event begins!
                          </div>
                        )}
                        {evtTiming?.nudgeEarlyLeave && (
                          <div className="mt-2 text-xs text-neutral-500">
                            You leave before the event ends. You might not enjoy it in full.
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeFromItinerary(idx)} className={`p-2 rounded-md shrink-0 ${isClosed ? "text-yellow-700 hover:bg-yellow-100" : "text-red-500 hover:bg-red-50"}`}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                    
                    {item.transit_instruction && idx < itineraryItems.length - 1 && (
                      <div className="flex ml-8 pl-4 py-1 border-l-2 border-dashed border-neutral-200 relative">
                        <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 bg-white rounded-full p-0.5 border-2 border-neutral-200">
                          {transport === "CAR" ? <Car size={10} className="text-neutral-400" /> : transport === "BUS" ? <Bus size={10} className="text-neutral-400" /> : <Bike size={10} className="text-neutral-400" />}
                        </div>
                        <div className="bg-neutral-50 rounded p-2 text-xs text-neutral-600 flex-1 ml-4 border border-neutral-100">
                          {(() => {
                            try {
                              const instr = JSON.parse(item.transit_instruction);
                              if (Array.isArray(instr)) {
                                return instr.map((step, i) => (
                                  <div key={i} className="mb-1 last:mb-0">
                                    <span className="font-semibold text-neutral-800">{step.line || step.instruction}</span>
                                    {step.departure && <span>: {step.departure} → {step.arrival} {step.stops}</span>}
                                  </div>
                                ));
                              }
                            } catch (e) {
                               // ignore
                            }
                            return <span>{Math.round(parseInt(item.transit_instruction) / 60) || 30} mins {transport.toLowerCase()} ride</span>;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-white border-t border-neutral-100 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-10">
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
                  disabled={!hasUncalculatedChanges || itineraryItems.length === 0 || isCalculating}
                  className={`flex-1 py-3 rounded-md font-medium disabled:opacity-50 transition-all ${hasUncalculatedChanges ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.5)] ring-2 ring-blue-400 hover:bg-blue-100" : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"}`}
                >
                  {isCalculating ? "Calculating..." : "Recalculate Itinerary"}
                </button>
                <button
                  onClick={handleSaveTourClick}
                  disabled={itineraryItems.length === 0 || hasUncalculatedChanges}
                  className="flex-1 py-3 bg-black text-white rounded-md font-medium disabled:opacity-50 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  {hasTimeWarnings && <AlertTriangle size={18} className="text-yellow-400" />} Continue
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Time Warning Popup */}
        {showTimeWarningPopup && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl flex flex-col p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="text-yellow-500" size={24} />
                <h2 className="font-bold text-xl text-neutral-900">Time Warning</h2>
              </div>
              <p className="text-neutral-500 mb-6 leading-relaxed">Some events in your itinerary have timing conflicts or late arrival warnings. Do you want to proceed anyway?</p>
              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setShowTimeWarningPopup(false)} 
                  className="flex-1 py-3 px-4 bg-neutral-100 text-neutral-900 font-medium rounded-md hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { setShowTimeWarningPopup(false); setStep(5); }} 
                  className="flex-1 py-3 px-4 bg-black text-white font-medium rounded-md hover:bg-neutral-800 transition-colors"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}

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

      </div>
    );
  }

  // Step 5: Save and Finish
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
  );
}
