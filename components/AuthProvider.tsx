"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useStore } from "@/lib/store";
import { Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, loadFromFirestore, _hasHydrated, isGuest } = useStore();
  const [authResolved, setAuthResolved] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await loadFromFirestore(currentUser.uid);
        } catch (e) {
          console.error(e);
        }
      }
      setAuthResolved(true);
    });
    return () => unsub();
  }, [setUser, loadFromFirestore]);

  useEffect(() => {
    if (authResolved && _hasHydrated) {
       const user = auth.currentUser;
       // If not logged in and not guest, redirect to sign in
       if (!user && !isGuest && !pathname.startsWith('/view/sign_in') && pathname !== '/') {
           router.push('/view/sign_in');
       }
    }
  }, [authResolved, _hasHydrated, isGuest, pathname, router]);

  const isRouting = authResolved && _hasHydrated && !auth.currentUser && !isGuest && !pathname.startsWith('/view/sign_in') && pathname !== '/';
  const showLoader = !authResolved || !_hasHydrated || isRouting;

  return (
    <>
      {showLoader && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 animate-spin text-neutral-800" />
        </div>
      )}
      {children}
    </>
  );
}
