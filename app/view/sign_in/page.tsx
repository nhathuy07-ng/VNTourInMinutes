"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";

export default function SignIn() {
  const router = useRouter();
  const { setUser, loadFromFirestore } = useStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadFromFirestore(user.uid);
        router.push("/view/main");
      }
    });
    return () => unsub();
  }, [setUser, loadFromFirestore, router]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGuest = () => {
    router.push("/view/main");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-neutral-900">
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center max-w-sm mx-auto w-full">
        <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mb-4">
          <MapPin size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">VNTourInMinutes</h1>
        <p className="text-neutral-500 text-lg pb-8">
          Plan your own tour in minutes.
        </p>

        <button
          onClick={handleSignIn}
          className="w-full py-3 px-6 bg-black text-white rounded-md font-medium text-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <button
          onClick={handleGuest}
          className="w-full py-3 px-6 bg-white text-neutral-900 border border-neutral-200 rounded-md font-medium text-lg hover:bg-neutral-50 transition-colors"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
