"use client"
import { useUIStore } from '@/store/useUIStore'
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import React, { useEffect } from 'react'

function OfflineBanner() {
    const isOnline = useUIStore((state) => state.isOnline);
    const setIsOnline = useUIStore((state) => state.setIsOnline);

    useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [setIsOnline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-0 left-0 w-full bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center gap-2 z-[100] shadow-md"
          dir="rtl"
        >
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">
            أنت غير متصل بالإنترنت حالياً. بعض الميزات قد لا تعمل.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OfflineBanner