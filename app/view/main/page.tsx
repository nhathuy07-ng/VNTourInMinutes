"use client";

import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Map, LogOut, RefreshCw, X, Menu, Globe, MessageSquare, LogIn, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useState, useRef } from "react";
import { useTranslation } from "@/lib/localization";

export default function MainView() {
  const router = useRouter();
  const { itineraries, user, setUser, setItineraries } = useStore();
  const { t, language, setLanguage } = useTranslation();
  const [showPastTours, setShowPastTours] = useState(false);
  const [showModeChooser, setShowModeChooser] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<"main" | "language">("main");
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
    setItineraries([]);
    router.push("/view/sign_in");
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingAndTodayTours = [...itineraries]
    .filter(it => it.Start_DateTime.split('T')[0] >= todayStr)
    .sort((a, b) => a.Start_DateTime.localeCompare(b.Start_DateTime));

  const pastTours = [...itineraries]
    .filter(it => it.Start_DateTime.split('T')[0] < todayStr)
    .sort((a, b) => b.Start_DateTime.localeCompare(a.Start_DateTime));

  const upcoming = upcomingAndTodayTours[0];
  const upcomingOrTodayTitle = upcoming && upcoming.Start_DateTime.split('T')[0] === todayStr 
    ? t("todays_tour") 
    : t("your_upcoming_tour");

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-20 font-sans">
      <header className="h-20 px-6 bg-white border-b border-neutral-100 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t("your_tours")}</h1>
          {user && <p className="text-sm text-neutral-500">{t("signed_in_as")} {user.email}</p>}
        </div>
        <div className="relative">
          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              setMenuView("main");
            }}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-800 hover:text-black hover:bg-neutral-100 border border-neutral-200 rounded-md transition-colors"
            aria-label={t("menu")}
          >
            <Menu size={22} />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => {
                  setIsMenuOpen(false);
                  setMenuView("main");
                }}
              />
              <div className="absolute right-0 top-12 mt-2 w-60 bg-white border border-neutral-200 rounded-xl p-1.5 z-30 flex flex-col gap-1">
                {menuView === "main" ? (
                  <>
                    <button
                      onClick={() => {
                        handleRefresh();
                      }}
                      disabled={!user || isRefreshing}
                      className="min-h-[44px] w-full flex items-center gap-3 px-3 py-2 text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200 rounded-lg transition-colors text-left text-sm font-medium disabled:opacity-50"
                    >
                      <RefreshCw size={18} className={`text-neutral-500 ${isRefreshing ? "animate-spin text-black" : ""}`} />
                      <span>{t("refresh")}</span>
                    </button>

                    <button
                      onClick={() => setMenuView("language")}
                      className="min-h-[44px] w-full flex items-center justify-between px-3 py-2 text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200 rounded-lg transition-colors text-left text-sm font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <Globe size={18} className="text-neutral-500" />
                        <span>{t("language")}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 font-semibold">
                        <span>{language === "vi" ? "Tiếng Việt" : "English"}</span>
                        <ChevronRight size={16} className="text-neutral-400" />
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowFeedback(true);
                      }}
                      className="min-h-[44px] w-full flex items-center gap-3 px-3 py-2 text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200 rounded-lg transition-colors text-left text-sm font-medium"
                    >
                      <MessageSquare size={18} className="text-neutral-500" />
                      <span>{t("feedback")}</span>
                    </button>

                    <div className="border-t border-neutral-100 my-1" />

                    {user ? (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleSignOut();
                        }}
                        className="min-h-[44px] w-full flex items-center gap-3 px-3 py-2 text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200 rounded-lg transition-colors text-left text-sm font-medium"
                      >
                        <LogOut size={18} className="text-neutral-500" />
                        <span>{t("sign_out")}</span>
                      </button>
                    ) : (
                      <Link
                        href="/view/sign_in"
                        onClick={() => setIsMenuOpen(false)}
                        className="min-h-[44px] w-full flex items-center gap-3 px-3 py-2 text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200 rounded-lg transition-colors text-left text-sm font-medium"
                      >
                        <LogIn size={18} className="text-neutral-500" />
                        <span>{t("sign_in_btn")}</span>
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setMenuView("main")}
                      className="min-h-[40px] w-full flex items-center gap-2 px-2 py-1.5 text-neutral-600 hover:text-black font-semibold text-xs border-b border-neutral-100 mb-1"
                    >
                      <ChevronLeft size={16} />
                      <span>{t("language")}</span>
                    </button>

                    <button
                      onClick={() => {
                        setLanguage("en");
                        setMenuView("main");
                        setIsMenuOpen(false);
                      }}
                      className="min-h-[44px] w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-100 active:bg-neutral-200 rounded-lg text-left text-sm font-medium transition-colors"
                    >
                      <span>English</span>
                      {language === "en" && <Check size={16} className="text-black" />}
                    </button>

                    <button
                      onClick={() => {
                        setLanguage("vi");
                        setMenuView("main");
                        setIsMenuOpen(false);
                      }}
                      className="min-h-[44px] w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-100 active:bg-neutral-200 rounded-lg text-left text-sm font-medium transition-colors"
                    >
                      <span>Tiếng Việt</span>
                      {language === "vi" && <Check size={16} className="text-black" />}
                    </button>
                  </div>
                )}
              </div>
            </>
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
              <p className="text-xl font-medium text-neutral-700 mb-8">{t("no_upcoming_tours")}</p>
              
              <div className="flex flex-col gap-4 w-full max-w-sm">
                <button
                  onClick={() => setShowModeChooser(true)}
                  className="w-full py-3 px-6 bg-black text-white rounded-md font-medium text-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  {t("plan_your_tour")}
                </button>
              </div>
            </div>
            
            {pastTours.length > 0 && (
              <div className="absolute bottom-0 w-full flex justify-center">
                <button 
                  onClick={() => setShowPastTours(true)}
                  className="text-sm font-semibold text-neutral-500 hover:text-neutral-800 transition-colors py-2 uppercase tracking-wider underline underline-offset-4"
                >
                  {t("view_past_tours")}
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
                  className="block bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 bg-white text-blue-500 shadow-sm border border-blue-200 rounded text-xs font-semibold uppercase tracking-wider">
                      {new Date(upcoming.Start_DateTime).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-0.5">{upcoming.name}</h3>
                  <p className="text-xs text-blue-600">{upcoming.City}</p>
                </Link>
              </div>
            )}

            {upcomingAndTodayTours.length > 0 && (
              <>
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">{t("all_tours")}</h2>
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
                  {t("view_past_tours")}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {itineraries.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setShowModeChooser(true)}
            className="w-14 h-14 bg-black text-white rounded-md flex items-center justify-center shadow-lg hover:bg-neutral-800 transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Mode Chooser Popup */}
      {showModeChooser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col p-6">
            <h2 className="font-bold text-xl mb-4 text-neutral-900">{t("choose_planning_mode")}</h2>
            
            <div className="flex flex-col gap-3 mb-6">
              <button
                onClick={() => router.push("/view/new_event_itinerary")}
                className="flex flex-col text-left p-4 rounded-xl border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 bg-white transition-all"
              >
                <span className="font-semibold text-neutral-900 mb-1">{t("mode_events_title")}</span>
                <span className="text-sm text-neutral-500">{t("mode_events_desc")}</span>
              </button>
              <button
                onClick={() => router.push("/view/new_itinerary")}
                className="flex flex-col text-left p-4 rounded-xl border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 bg-white transition-all"
              >
                <span className="font-semibold text-neutral-900 mb-1">{t("mode_attractions_title")}</span>
                <span className="text-sm text-neutral-500">{t("mode_attractions_desc")}</span>
              </button>
            </div>

            <div className="flex items-center w-full">
              <button 
                onClick={() => setShowModeChooser(false)} 
                className="w-full py-3 px-4 bg-neutral-100 text-neutral-900 font-medium rounded-md hover:bg-neutral-200 transition-colors"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Past Tours Modal */}
      {showPastTours && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-neutral-100 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg">{t("past_tours")}</h2>
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
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-[640px] h-[667px] max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-neutral-200">
            <div className="p-3 sm:p-4 border-b border-neutral-100 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg text-neutral-900">{t("feedback")}</h2>
              <button 
                onClick={() => setShowFeedback(false)}
                className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Close feedback"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 w-full h-full relative overflow-hidden bg-neutral-50">
              <iframe
                src="https://docs.google.com/forms/d/e/1FAIpQLSewk3qsl-OZhnF-Dsif2ykJS3VzybrbUHKa7ADZ0JODTobcGA/viewform?embedded=true"
                width="640"
                height="667"
                className="w-full h-full border-0"
                frameBorder={0}
                marginHeight={0}
                marginWidth={0}
                title="Feedback Form"
              >
                Loading…
              </iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
