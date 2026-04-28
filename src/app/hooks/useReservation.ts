import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { BookingService } from "@/app/services/booking.service";
import { BookingWithMeta } from "@/types/booking.types";

/* =========================================================
  RESERVATIONS HOOK (FINAL CLEAN VERSION)
========================================================= */

export function useReservations() {
  const [reservations, setReservations] = useState<BookingWithMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const isMounted = useRef(true);

  /* =========================================================
    MOUNT / UNMOUNT SAFETY
  ========================================================= */
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* =========================================================
    LOAD USER
  ========================================================= */
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!isMounted.current) return;

      if (error || !data?.user?.id) {
        setUserId(null);
        return;
      }

      setUserId(data.user.id);
    };

    loadUser();
  }, []);

  /* =========================================================
    FETCH BOOKINGS
  ========================================================= */
  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await BookingService.getAll();

      if (!isMounted.current) return;

      setReservations(data ?? []);
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || "Failed to load reservations");
    } finally {
      if (!isMounted.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  /* =========================================================
    REALTIME SYNC (OPTION 1: SAFE REFRESH STRATEGY)
  ========================================================= */
  useEffect(() => {
    const channel = supabase
      .channel("realtime-bookings")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        async () => {
          const data = await BookingService.getAll();
          if (!isMounted.current) return;
          setReservations(data ?? []);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        async () => {
          const data = await BookingService.getAll();
          if (!isMounted.current) return;
          setReservations(data ?? []);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bookings" },
        async () => {
          const data = await BookingService.getAll();
          if (!isMounted.current) return;
          setReservations(data ?? []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* =========================================================
    ACTION WRAPPER (SAFE + CONSISTENT)
  ========================================================= */
  const runAction = useCallback(
    async (fn: () => Promise<BookingWithMeta | null>) => {
      if (!userId) {
        setError("User not authenticated");
        return;
      }

      setActionLoading(true);
      setError(null);

      try {
        const updated = await fn();

        if (!isMounted.current || !updated) return;

        setReservations((prev) => {
          const exists = prev.some((b) => b.id === updated.id);

          if (!exists) return [updated, ...prev];

          return prev.map((b) =>
            b.id === updated.id ? { ...b, ...updated } : b
          );
        });
      } catch (err: any) {
        if (!isMounted.current) return;
        setError(err?.message || "Action failed");
      } finally {
        if (!isMounted.current) return;
        setActionLoading(false);
      }
    },
    [userId]
  );

  /* =========================================================
    ACTIONS (SYNCED WITH BOOKING SERVICE)
  ========================================================= */

  const approve = useCallback(
    (id: number) =>
      runAction(() =>
        BookingService.updateStatus(id, "approved", userId!)
      ),
    [runAction, userId]
  );

  const decline = useCallback(
    (id: number) =>
      runAction(() =>
        BookingService.updateStatus(id, "rejected", userId!)
      ),
    [runAction, userId]
  );

  const checkIn = useCallback(
    (id: number) =>
      runAction(() =>
        BookingService.updateStatus(id, "checked_in", userId!)
      ),
    [runAction, userId]
  );

  const checkOut = useCallback(
    (id: number) =>
      runAction(() =>
        BookingService.updateStatus(id, "checked_out", userId!)
      ),
    [runAction, userId]
  );

  /* =========================================================
    RETURN
  ========================================================= */
  return {
    reservations,
    loading,
    actionLoading,
    error,

    approve,
    decline,
    checkIn,
    checkOut,

    refresh: fetchReservations,
  };
}