"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStore } from "@/store/useOnlineStore";

export function usePresence() {
  const setOnlineIds = useOnlineStore((s) => s.setOnlineIds);
  const addOnlineId = useOnlineStore((s) => s.addOnlineId);
  const removeOnlineId = useOnlineStore((s) => s.removeOnlineId);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const channel = supabase.channel("online-users");

    channel
      .on("presence", { event: "sync" }, () => {
        if (!isMounted) return;
        const state = channel.presenceState();
        const onlineIds = new Set<string>();
        for (const presences of Object.values(state)) {
          for (const presence of presences as unknown as { user_id: string }[]) {
            onlineIds.add(presence.user_id);
          }
        }
        setOnlineIds(onlineIds);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        if (!isMounted) return;
        for (const presence of newPresences as unknown as { user_id: string }[]) {
          addOnlineId(presence.user_id);
        }
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        if (!isMounted) return;
        for (const presence of leftPresences as unknown as { user_id: string }[]) {
          removeOnlineId(presence.user_id);
        }
      });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED" && isMounted) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await channel.track({
            user_id: session.user.id,
            online_at: new Date().toISOString(),
          });
        }
      }
    });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [setOnlineIds, addOnlineId, removeOnlineId]);
}
