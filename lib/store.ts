import { create } from "zustand";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import { Itinerary } from "./types";
import { User } from "firebase/auth";
import { db } from "./firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  itineraries: Itinerary[];
  setItineraries: (itineraries: Itinerary[]) => void;
  addItinerary: (itinerary: Itinerary) => void;
  updateItinerary: (id: string, itinerary: Partial<Itinerary>) => void;
  deleteItinerary: (id: string) => void;
  loadFromFirestore: (uid: string) => Promise<void>;
  saveItineraryToFirestore: (uid: string, itinerary: Itinerary) => Promise<void>;
}

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
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
      user: null,
      setUser: (user) => set_zustand({ user }),
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
          await deleteDoc(doc(db, "itinerary", user.uid, "user_itineraries", id));
        }
      },
      loadFromFirestore: async (uid: string) => {
        try {
          const snapshot = await getDocs(collection(db, "itinerary", uid, "user_itineraries"));
          const itineraries = snapshot.docs.map(doc => doc.data() as Itinerary);
          set_zustand({ itineraries });
        } catch (e) {
          console.error("Failed to load itineraries from Firestore", e);
        }
      },
      saveItineraryToFirestore: async (uid: string, itinerary: Itinerary) => {
        try {
          await setDoc(doc(db, "itinerary", uid, "user_itineraries", itinerary.id), itinerary);
        } catch (e) {
          console.error("Failed to save itinerary to Firestore", e);
        }
      },
    }),
    {
      name: "vntour-storage",
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ itineraries: state.itineraries }), // Only persist itineraries locally
    }
  )
);
