"use client";

import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Map, LogOut, ChevronDown, ChevronUp, X, RefreshCw } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useState, useRef } from "react";

export default function MainView() {
  const router = useRouter();
  const { itineraries, user, setUser, setItineraries } = useStore();
  const [showPastTours, setShowPastTours] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastRefreshTime = useRef(0);

  const { loadFromFirestore } = useStore();
  const handleRefresh = async () => {
    if (!user) return;
    
    // 5-second rate limit
    const now = Date.now();
    if (now - lastRefreshTime.current < 5000) {
      return;
    }
    
    lastRefreshTime.current = now;
    setIsRefreshing(true);
    await loadFromFirestore(user.uid);
    setIsRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setItineraries([]); // Clear local state, but idb will persist for guest? Actually, guests have IDB. Let's just sign out.
    router.push("/view/sign_in");
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingAndTodayTours = [...itineraries]
    .filter(it => it.Start_DateTime.split('T')[0] >= todayStr)
    .sort((a, b) => a.Start_DateTime.localeCompare(b.Start_DateTime));

  const pastTours = [...itineraries]
    .filter(it => it.Start_DateTime.split('T')[0] < todayStr)
    .sort((a, b) => b.Start_DateTime.localeCompare(a.Start_DateTime)); // Show most recent past tours first

  const upcoming = upcomingAndTodayTours[0];
  const upcomingOrTodayTitle = upcoming && upcoming.Start_DateTime.split('T')[0] === todayStr 
    ? "Today's tour" 
    : "Your upcoming tour";

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-20 font-sans">
      <header className="h-20 px-6 bg-white border-b border-neutral-100 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your Tours</h1>
          {user && <p className="text-sm text-neutral-500">Signed in as {user.email}</p>}
        </div>
        <div className="flex gap-2">
          {user ? (
            <>
              <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 text-neutral-400 hover:text-black transition-colors disabled:opacity-50">
                <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
              </button>
              <button onClick={handleSignOut} className="p-2 text-neutral-400 hover:text-black transition-colors">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link href="/view/sign_in" className="px-4 py-2 bg-black text-white rounded-md font-medium text-sm hover:bg-neutral-800">
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="p-6">
        {upcomingAndTodayTours.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 min-h-[60vh] relative">
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
                <Map size={48} className="text-neutral-300" />
              </div>
              <p className="text-xl font-medium text-neutral-700 mb-8">No upcoming tours.</p>
              
              <div className="flex flex-col gap-4 w-full max-w-sm">
                <Link
                  href="/view/new_itinerary"
                  className="w-full py-3 px-6 bg-black text-white rounded-md font-medium text-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Plan your tour!
                </Link>
              </div>
            </div>
            
            {pastTours.length > 0 && (
              <div className="absolute bottom-0 w-full flex justify-center">
                <button 
                  onClick={() => setShowPastTours(true)}
                  className="text-sm font-semibold text-neutral-500 hover:text-neutral-800 transition-colors py-2 uppercase tracking-wider underline underline-offset-4"
                >
                  View past tours
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming / Today tour */}
            {upcoming && (
              <div className="mb-8">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">{upcomingOrTodayTitle}</h2>
                <Link 
                  href={`/view/itinerary/${upcoming.id}`}
                  className="block bg-black text-white rounded-xl p-4 cursor-pointer hover:bg-neutral-900 transition-colors"
                >
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-xs font-semibold uppercase tracking-wider">
                      {new Date(upcoming.Start_DateTime).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-0.5">{upcoming.name}</h3>
                  <p className="text-xs text-neutral-400">{upcoming.City}</p>
                </Link>
              </div>
            )}

            {upcomingAndTodayTours.length > 0 && (
              <>
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">All tours</h2>
                <div className="grid gap-4">
                  {upcomingAndTodayTours.map(it => (
                    <Link 
                      key={it.id} 
                      href={`/view/itinerary/${it.id}`}
                      className="block bg-neutral-50 border border-neutral-100 rounded-xl p-4 cursor-pointer hover:bg-neutral-100 transition-colors"
                    >
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-semibold uppercase tracking-wider text-neutral-500 shadow-sm">
                          {new Date(it.Start_DateTime).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold mb-0.5">{it.name}</h3>
                      <p className="text-xs text-neutral-500">{it.City}</p>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {pastTours.length > 0 && (
              <div className="pt-6 border-t border-neutral-100 mt-8 flex justify-center">
                <button 
                  onClick={() => setShowPastTours(true)}
                  className="text-sm font-semibold text-neutral-500 hover:text-neutral-800 transition-colors py-2 uppercase tracking-wider underline underline-offset-4"
                >
                  View past tours
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {itineraries.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <Link
            href="/view/new_itinerary"
            className="w-14 h-14 bg-black text-white rounded-md flex items-center justify-center shadow-lg hover:bg-neutral-800 transition-colors"
          >
            <Plus size={24} />
          </Link>
        </div>
      )}

      {/* Past Tours Modal */}
      {showPastTours && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-neutral-100 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg">Past Tours</h2>
              <button 
                onClick={() => setShowPastTours(false)}
                className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 flex-1">
              <div className="grid gap-4">
                {pastTours.map(it => (
                  <Link 
                    key={it.id} 
                    href={`/view/itinerary/${it.id}`}
                    className="block bg-neutral-50/50 border border-neutral-100 rounded-xl p-4 cursor-pointer hover:bg-neutral-50 transition-colors opacity-75"
                  >
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-1 bg-white border border-neutral-200 rounded text-xs font-semibold uppercase tracking-wider text-neutral-500 shadow-sm">
                        {new Date(it.Start_DateTime).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold mb-0.5 text-neutral-700">{it.name}</h3>
                    <p className="text-xs text-neutral-500">{it.City}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
