"use client";

import { usePresence } from "../hooks/usePresence";

export default function PresenceInitializer() {
  usePresence();
  return null;
}
