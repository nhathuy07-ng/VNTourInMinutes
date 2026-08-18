"use client";

import { useStore } from "@/lib/store";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Share, Trash2, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { Itinerary } from "@/lib/types";

export default function ItineraryView() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { itineraries, deleteItinerary } = useStore();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    const found = itineraries.find(i => i.id === id);
    if (found) setItinerary(found);
  }, [id, itineraries]);

  if (!itinerary) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  const handleDelete = () => {
    deleteItinerary(id);
    router.push("/view/main");
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-24">
      <header className="px-4 py-4 flex items-center justify-between border-b border-neutral-200 sticky top-0 bg-white z-10">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-neutral-100">
            <ChevronLeft size={24} />
          </button>
          <h1 className="ml-2 font-bold text-lg">Tour Details</h1>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-full text-neutral-600 hover:bg-neutral-100"><Share size={20} /></button>
          <button onClick={handleDelete} className="p-2 rounded-full text-red-500 hover:bg-red-50"><Trash2 size={20} /></button>
        </div>
      </header>

      <main className="p-6">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">{itinerary.name}</h2>
          <p className="text-neutral-500">{new Date(itinerary.Start_DateTime).toLocaleDateString()} â {itinerary.City}</p>
          <div className="mt-4 inline-block bg-neutral-200 px-3 py-1 rounded-full text-sm font-bold text-neutral-700">
            Transport: {itinerary.transport}
          </div>
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {itinerary.items.map((item, idx) => (
            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-neutral-900 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                <MapPin size={16} />
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-neutral-500">{formatTime(item.start_time)}</span>
                  <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded">
                    {Math.round((item.suggested_stay_time_secs || 3600) / 60)} mins
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                <p className="text-sm text-neutral-500">{item.address || `${item.category} ${item.is_outdoor ? '(Outdoor)' : '(Indoor)'}`}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
