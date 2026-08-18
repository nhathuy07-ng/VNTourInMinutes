"use client";

import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Map, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function MainView() {
  const router = useRouter();
  const { itineraries, user, setUser, setItineraries } = useStore();

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setItineraries([]); // Clear local state, but idb will persist for guest? Actually, guests have IDB. Let's just sign out.
    router.push("/view/sign_in");
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-20 font-sans">
      <header className="h-20 px-6 bg-white border-b border-neutral-100 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Your Tours</h1>
          {user && <p className="text-sm text-neutral-500">Signed in as {user.email}</p>}
        </div>
        <div className="flex gap-2">
          {user ? (
            <button onClick={handleSignOut} className="p-2 text-neutral-400 hover:text-black">
              <LogOut size={20} />
            </button>
          ) : (
            <Link href="/view/sign_in" className="px-4 py-2 bg-black text-white rounded-md font-medium text-sm hover:bg-neutral-800">
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="p-6">
        {itineraries.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
              <Map size={48} className="text-neutral-300" />
            </div>
            <p className="text-xl font-medium text-neutral-700 mb-8">No tours planned yet.</p>
            
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <Link
                href="/view/new_itinerary"
                className="w-full py-3 px-6 bg-black text-white rounded-md font-medium text-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Plan your tour!
              </Link>
              <button
                disabled
                className="w-full py-3 px-6 bg-white text-neutral-400 border border-neutral-200 rounded-md font-medium text-lg cursor-not-allowed"
              >
                Plan with friends
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Find upcoming tour */}
            {(() => {
              const now = new Date().toISOString();
              const upcoming = [...itineraries]
                .filter(it => it.Start_DateTime >= now)
                .sort((a, b) => a.Start_DateTime.localeCompare(b.Start_DateTime))[0];
              
              if (!upcoming) return null;

              return (
                <div className="mb-8">
                  <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Your upcoming tour</h2>
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
              );
            })()}

            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">All tours</h2>
            <div className="grid gap-4">
              {[...itineraries].sort((a, b) => a.Start_DateTime.localeCompare(b.Start_DateTime)).map(it => (
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
    </div>
  );
}
