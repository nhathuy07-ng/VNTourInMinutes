import { create } from "zustand";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import { Itinerary } from "./types";
import { User } from "firebase/auth";
import { db, auth } from "./firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, getDocFromCache } from "firebase/firestore";
import { Language } from "./localization";

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isGuest: boolean;
  setIsGuest: (val: boolean) => void;
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  itineraries: Itinerary[];
  setItineraries: (itineraries: Itinerary[]) => void;
  addItinerary: (itinerary: Itinerary) => void;
  updateItinerary: (id: string, itinerary: Partial<Itinerary>) => void;
  deleteItinerary: (id: string) => void;
  loadFromFirestore: (uid: string) => Promise<void>;
  loadItinerary: (uid: string, id: string) => Promise<Itinerary | null>;
  saveItineraryToFirestore: (uid: string, itinerary: Itinerary) => Promise<void>;
}

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    await auth.authStateReady();
    if (auth.currentUser) return null;
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export const useStore = create<AppState>()(
  persist(
    (set_zustand, get_zustand) => ({
      language: "en",
      setLanguage: (language) => set_zustand({ language }),
      user: null,
      setUser: (user) => set_zustand({ user }),
      isGuest: false,
      setIsGuest: (isGuest) => set_zustand({ isGuest }),
      _hasHydrated: false,
      setHasHydrated: (val) => set_zustand({ _hasHydrated: val }),
      itineraries: [],
      setItineraries: (itineraries) => set_zustand({ itineraries }),
      addItinerary: (itinerary) => {
        set_zustand((state) => ({ itineraries: [...state.itineraries, itinerary] }));
        const { user, saveItineraryToFirestore } = get_zustand();
        if (user) {
          saveItineraryToFirestore(user.uid, itinerary);
        }
      },
      updateItinerary: (id, newItin) => {
        set_zustand((state) => ({
          itineraries: state.itineraries.map((it) =>
            it.id === id ? { ...it, ...newItin } : it
          ),
        }));
        const { user, saveItineraryToFirestore, itineraries } = get_zustand();
        if (user) {
          const updated = itineraries.find(it => it.id === id);
          if (updated) saveItineraryToFirestore(user.uid, updated);
        }
      },
      deleteItinerary: async (id) => {
        set_zustand((state) => ({
          itineraries: state.itineraries.filter((it) => it.id !== id),
        }));
        const { user } = get_zustand();
        if (user) {
          try {
             await deleteDoc(doc(db, "users", user.uid, "itineraries", id));
             const listDocRef = doc(db, "users", user.uid, "itineraries", "list");
             const listDoc = await getDoc(listDocRef);
             if (listDoc.exists()) {
                const data = listDoc.data();
                if (data.list) {
                    await setDoc(listDocRef, { list: data.list.filter((i: any) => i.id !== id) });
                }
             }
          } catch (e) {
             console.error("Failed to delete itinerary from Firestore", e);
          }
        }
      },
      loadItinerary: async (uid: string, id: string) => {
        try {
          const docRef = doc(db, "users", uid, "itineraries", id);
          let d;
          try {
              d = await getDocFromCache(docRef);
          } catch(e) {
              // Not in cache, fetch from server
              d = await getDoc(docRef);
          }
          if (d.exists()) {
             const itin = d.data() as Itinerary;
             set_zustand((state) => ({
               itineraries: state.itineraries.some(i => i.id === id) 
                  ? state.itineraries.map(i => i.id === id ? { ...i, ...itin } : i)
                  : [...state.itineraries, itin]
             }));
             return itin;
          }
        } catch(e) {
           console.error("Failed to load full itinerary", e);
        }
        return null;
      },
      loadFromFirestore: async (uid: string) => {
        try {
          // Initialize list document if it doesn't exist to prevent permission missing errors if parent doc is required
          const listDocRef = doc(db, "users", uid, "itineraries", "list");
          let listDoc;
          try {
             listDoc = await getDoc(listDocRef);
          } catch(e) {
             console.warn("Network fetch failed, attempting cache fetch...", e);
             listDoc = await getDocFromCache(listDocRef);
          }
          
          if (!listDoc.exists()) {
              // If we are offline, setDoc might fail, but let's try
              try { await setDoc(listDocRef, { list: [] }); } catch(err) {}
              set_zustand({ itineraries: [] });
              return;
          }

          const data = listDoc.data();
          if (data && data.list) {
              set_zustand({ itineraries: data.list as Itinerary[] });
          } else {
              set_zustand({ itineraries: [] });
          }
        } catch (e) {
          console.error("Failed to load itineraries from Firestore", e);
        }
      },
      saveItineraryToFirestore: async (uid: string, itinerary: Itinerary) => {
        try {
          // Save the full document
          await setDoc(doc(db, "users", uid, "itineraries", itinerary.id), itinerary);
          
          // Update the summary list
          const listDocRef = doc(db, "users", uid, "itineraries", "list");
          const listDoc = await getDoc(listDocRef);
          const summary = {
             id: itinerary.id,
             name: itinerary.name,
             City: itinerary.City,
             Start_DateTime: itinerary.Start_DateTime,
             transport: itinerary.transport
          };
          
          if (listDoc.exists()) {
             const data = listDoc.data();
             let list = data.list || [];
             const idx = list.findIndex((i: any) => i.id === itinerary.id);
             if (idx >= 0) {
                 list[idx] = summary;
             } else {
                 list.push(summary);
             }
             await setDoc(listDocRef, { list });
          } else {
             await setDoc(listDocRef, { list: [summary] });
          }
        } catch (e) {
          console.error("Failed to save itinerary to Firestore", e);
        }
      },
    }),
    {
      name: "vntour-storage",
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ itineraries: state.itineraries, isGuest: state.isGuest }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
