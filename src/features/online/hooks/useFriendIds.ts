import { useQuery } from "@tanstack/react-query";
import { getFriendIdsAction } from "../actions";

export function useFriendIds() {
  return useQuery({
    queryKey: ["friend-ids"],
    queryFn: async () => {
      const result = await getFriendIdsAction();
      if (!result.success) throw new Error(result.error);
      return result.data as string[];
    },
    staleTime: 60_000,
  });
}
