"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Search, Calendar, ExternalLink, Loader2, Info, X } from "lucide-react";
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
  source_url: string;
  participations: EventParticipation[];
}

export default function NewEventItinerary() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [city, setCity] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedParticipationIds, setSelectedParticipationIds] = useState<string[]>([]);

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
    if (step > 1) {
      setStep(1);
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
          categories: selectedCategories
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Failed to find events.");
        return;
      }
      
      const loadedEvents = data.events || [];
      // Assign local IDs
      setEvents(loadedEvents.map((e: any, i: number) => ({ 
        ...e, 
        id: `evt-${i}`,
        participations: (e.participations || []).map((p: any, j: number) => ({
          ...p,
          id: `evt-${i}-part-${j}`
        }))
      })));
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
                    {event.source_url && (
                      <a 
                        href={event.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors mb-4"
                      >
                        Source <ExternalLink size={12} />
                      </a>
                    )}
                    
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
            className={`py-3 px-6 rounded-md font-medium text-base transition-colors flex items-center gap-2 ${
              selectedParticipationIds.length === 0 ? "bg-neutral-200 text-neutral-400" : "bg-black text-white hover:bg-neutral-800"
            }`}
          >
            {hasOverlapWarning() && <Info size={18} className="text-amber-400" />}
            Continue
          </button>
        </div>
      </footer>
    </div>
  );
}
