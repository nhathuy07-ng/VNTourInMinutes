"use client";

import { useStore } from "@/lib/store";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Share, Trash2, MapPin, Bus, Footprints, Route } from "lucide-react";
import { useState, useEffect } from "react";
import { Itinerary } from "@/lib/types";
import { VIETNAM_CITIES } from "@/lib/cities";

export default function ItineraryView() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { itineraries, deleteItinerary, loadItinerary } = useStore();
  const user = useStore(state => state.user);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    const found = itineraries.find(i => i.id === id);
    if (found) {
       setTimeout(() => setItinerary(found), 0);
       // If it doesn't have items, it's just a summary, load the full details
       if (!found.items && user) {
           loadItinerary(user.uid, id).then(fullItin => {
               if (fullItin) setItinerary(fullItin);
           });
       }
    } else if (user) {
        loadItinerary(user.uid, id).then(fullItin => {
            if (fullItin) setItinerary(fullItin);
        });
    }
  }, [id, itineraries, user, loadItinerary]);

  const getCategoryLabel = (cityId: string, categoryId: string) => {
    const city = VIETNAM_CITIES.find(c => c.id === cityId);
    if (!city) return categoryId;
    const placeType = city.place_types?.find(pt => pt.id === categoryId);
    return placeType ? placeType.en : categoryId;
  };

  if (!itinerary) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  const handleDelete = () => {
    deleteItinerary(id);
    router.push("/view/main");
  };

  const formatAddressForMaps = (name: string, address?: string) => {
    if (!address) return name;
    let cleanAddr = address.trim();
    if (cleanAddr.toLowerCase().endsWith('vietnam')) {
      cleanAddr = cleanAddr.slice(0, -7).trim();
      if (cleanAddr.endsWith(',')) cleanAddr = cleanAddr.slice(0, -1).trim();
    } else if (cleanAddr.toLowerCase().endsWith('việt nam')) {
      cleanAddr = cleanAddr.slice(0, -8).trim();
      if (cleanAddr.endsWith(',')) cleanAddr = cleanAddr.slice(0, -1).trim();
    }
    return `${name}, ${cleanAddr}`;
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderTransitInstruction = (instruction: string, item?: any, nextItem?: any) => {
    let linkHref = "";
    if (item && nextItem) {
        linkHref = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(formatAddressForMaps(item.name, item.address))}&destination=${encodeURIComponent(formatAddressForMaps(nextItem.name, nextItem.address))}&travelmode=transit`;
    }

    const renderLink = (additionalClass = "") => {
      if (!linkHref) return null;
      return (
        <a 
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-3 py-1.5 border border-blue-600 rounded-lg bg-white hover:bg-blue-50 text-sm font-medium text-blue-600 flex items-center gap-2 transition-colors self-start ${additionalClass}`}
        >
          <Route size={16} className="text-blue-600" />
          Get directions
        </a>
      );
    };
    try {
      const parsed = JSON.parse(instruction);
      const dataArr = Array.isArray(parsed) ? parsed : [parsed];
      
      return (
        <>
          {dataArr.map((data: any, idx: number) => (
            <div key={idx} className="flex flex-col pt-1 pb-1 px-6 ml-4 sm:ml-10 border-l-2 border-dashed border-neutral-200">
              <div className="text-sm font-medium text-neutral-600 bg-white border border-neutral-200 p-4 rounded-lg shadow-sm self-start">
                {data.type === "walk" ? (
                  <div className="flex flex-col gap-1"><div className="flex items-center gap-2">
                    <Footprints size={16} className="text-neutral-400" />
                    <span>{data.instruction}</span>
                  </div>
                  {dataArr.length === 1 && renderLink("mt-1 ml-6")}</div>
                ) : (
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2 font-bold text-neutral-800">
                      <Bus size={32} className="text-blue-500" />
                      <span>Take {data.line}</span>
                    </div>
                    <div className="text-neutral-500 ml-6 flex flex-wrap gap-1 items-center">
                      <span>{data.departure}</span>
                      <span>→</span>
                      <span>{data.arrival}</span>
                      <span className="font-semibold">{data.stops}</span>
                    </div>
                    {dataArr.length === 1 && renderLink("mt-1 ml-6")}
                  </div>
                )}
              </div>
            </div>
          ))}
          {dataArr.length > 1 && (
            <div className="flex flex-col pt-1 pb-1 px-6 ml-4 sm:ml-10 border-l-2 border-dashed border-neutral-200">
              {renderLink()}
            </div>
          )}
        </>
      );
    } catch {
      // Fallback for old itineraries stored before we stringified JSON
      return (
        <div className="flex flex-col py-3 px-6 ml-4 sm:ml-10 border-l-2 border-dashed border-neutral-200">
          <div className="text-sm font-medium text-neutral-600 bg-white border border-neutral-200 p-4 rounded-lg shadow-sm self-start">
            <div className="flex items-center gap-2">
              <Bus size={16} className="text-neutral-400" />
              <span>{instruction.replace("🚌 ", "")}</span>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-24 font-sans">
      <header className="h-16 px-6 flex items-center justify-between border-b border-neutral-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-neutral-400 hover:text-black">
            <ChevronLeft size={24} />
          </button>
          <h1 className="font-extrabold tracking-tight text-lg">Tour Details</h1>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-neutral-400 hover:text-black"><Share size={20} /></button>
          <button onClick={handleDelete} className="p-2 text-neutral-400 hover:text-red-500"><Trash2 size={20} /></button>
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        <div className="mb-4 space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-800">{itinerary.name}</h2>
          <div className="flex items-center flex-wrap gap-2 text-sm text-neutral-500 font-medium">
            <span>{new Date(itinerary.Start_DateTime).toLocaleDateString()}</span>
            <span>·</span>
            <span>{itinerary.City}</span>
            <span>·</span>
            <span className="capitalize">{itinerary.transport}</span>
          </div>
        </div>

        <div className="space-y-4">
          {itinerary.items ? itinerary.items.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              {idx === 0 && (
                <div className="flex flex-col items-start pb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
                    <span className="text-sm font-semibold text-blue-900 text-left">
                      Get direction to your first attraction
                    </span>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddressForMaps(item.name, item.address))}&travelmode=${itinerary.transport === 'CAR' ? 'driving' : itinerary.transport === 'BUS' ? 'transit' : 'bicycling'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg border border-blue-600 bg-white hover:bg-blue-50 text-sm font-medium text-blue-600 flex items-center gap-2 transition-colors self-stretch sm:self-auto justify-center"
                    >
                      <Route size={16} className="text-blue-600" />
                      Get directions
                    </a>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 items-start bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                
                <div className="flex-1 w-full">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-600 whitespace-nowrap">
                      {formatTime(item.start_time)} - {formatTime(item.end_time)}
                    </h3>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
                    <h3 className="font-bold text-xl text-neutral-800">{item.name}</h3>
                  </div>

                  <div className="flex items-center gap-2 mb-4 flex-wrap text-xs font-medium text-neutral-500">
                    <span className="uppercase tracking-wider">
                      {getCategoryLabel(itinerary.City, item.category)}
                    </span>
                    <span>•</span>
                    <span className="uppercase tracking-wider">
                      {item.is_outdoor ? 'Outdoor' : 'Indoor'}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                    {item.introduction}
                  </p>

                  {item.address && (
                    <div className="flex items-start gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                      <MapPin className="text-blue-500 shrink-0 mt-0.5" size={16} />
                      <span className="text-sm font-medium text-blue-900">
                        {item.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {item.transit_instruction && renderTransitInstruction(item.transit_instruction, item, itinerary.items[idx+1])}
              
              {idx < itinerary.items.length - 1 && (itinerary.transport === "CAR" || itinerary.transport === "BIKE") && (
                <div className="flex flex-col py-3 px-6 ml-4 sm:ml-10 border-l-2 border-dashed border-neutral-200">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(formatAddressForMaps(item.name, item.address))}&destination=${encodeURIComponent(formatAddressForMaps(itinerary.items[idx+1].name, itinerary.items[idx+1].address))}&travelmode=${itinerary.transport === 'CAR' ? 'driving' : 'bicycling'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 border border-blue-600 rounded-lg bg-white hover:bg-blue-50 text-sm font-medium text-blue-600 flex items-center gap-2 transition-colors self-start"
                  >
                    <Route size={16} className="text-blue-600" />
                    Get directions
                  </a>
                </div>
              )}
            </div>
          )) : (
            <div className="py-12 flex items-center justify-center text-neutral-400">Loading itinerary details...</div>
          )}
        </div>
      </main>
    </div>
  );
}
