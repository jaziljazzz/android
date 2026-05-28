import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useFavourites(userId: string | null | undefined) {
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    if (!userId) {
      setFavIds(new Set());
      return;
    }
    const { data } = await supabase
      .from("favourites")
      .select("salon_id")
      .eq("user_id", userId);
    setFavIds(new Set((data ?? []).map((r) => r.salon_id)));
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = useCallback(
    async (salonId: string) => {
      if (!userId) return;
      const wasFavourited = favIds.has(salonId);
      // optimistic update
      setFavIds((prev) => {
        const next = new Set(prev);
        if (wasFavourited) next.delete(salonId);
        else next.add(salonId);
        return next;
      });
      if (wasFavourited) {
        await supabase.from("favourites").delete().eq("user_id", userId).eq("salon_id", salonId);
      } else {
        await supabase.from("favourites").insert({ user_id: userId, salon_id: salonId });
      }
    },
    [userId, favIds],
  );

  return { favIds, toggle, reload, isFavourite: (id: string) => favIds.has(id) };
}
