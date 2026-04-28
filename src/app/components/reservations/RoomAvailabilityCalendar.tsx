'use client';

import { useMemo, useState, useCallback } from 'react';

/* =========================================================
  TYPES
========================================================= */

interface BookingRange {
  id?: number;
  room_id: number;
  start_at: string;
  end_at?: string | null;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  status?: string;
}

interface RoomType {
  id: number;
  name: string;
}

interface Room {
  id: number;
  room_number: string;
  room_type: RoomType | null;
}

interface Props {
  selectedRoom: number | null;
  setSelectedRoom: (id: number | null) => void;
  availability: BookingRange[];
  rooms: Room[];
  monthDays?: number;
}

/* =========================================================
  COMPONENT
========================================================= */

export default function RoomAvailabilityCalendar({
  selectedRoom,
  setSelectedRoom,
  availability,
  rooms,
  monthDays = 30,
}: Props) {

  const [loading] = useState(false);

  /* =========================================================
    🗓️ SELECTED MONTH (NEW FIX)
  ========================================================= */
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(), // 0-based
    };
  });

  /* =========================================================
    ROOM TYPES
  ========================================================= */
  const roomTypes: RoomType[] = useMemo(() => {
    const map = new Map<number, RoomType>();

    rooms.forEach((r) => {
      if (!r.room_type) return;

      map.set(r.room_type.id, {
        id: r.room_type.id,
        name: r.room_type.name,
      });
    });

    return Array.from(map.values());
  }, [rooms]);

  /* =========================================================
    ROOMS OF TYPE
  ========================================================= */
  const roomsOfType = useMemo(() => {
    if (!selectedRoom) return [];

    return rooms.filter(
      (r) => r.room_type?.id === selectedRoom
    );
  }, [rooms, selectedRoom]);

  const roomIds = useMemo(
    () => new Set(roomsOfType.map(r => r.id)),
    [roomsOfType]
  );

  /* =========================================================
    DATE HELPERS
  ========================================================= */
  const normalize = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const parseDate = (value: string | null | undefined) => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return normalize(d);
  };

  const isInRange = (target: Date, start: Date, end: Date) =>
    target.getTime() >= start.getTime() &&
    target.getTime() <= end.getTime();

  /* =========================================================
    🔥 FIXED BOOKING LOGIC
  ========================================================= */
  const isBooked = useCallback(
    (day: number) => {
      if (!selectedRoom) return false;

      const targetDate = normalize(
        new Date(selectedMonth.year, selectedMonth.month, day)
      );

      let debugMatches: BookingRange[] = [];

      const result = availability.some((b) => {

        if (!roomIds.has(b.room_id)) {
          return false;
        }

        const start = parseDate(b.start_at);
        const end = parseDate(b.end_at);

        if (!start || !end) {
          console.log("❌ INVALID DATE:", b);
          return false;
        }

        /* =====================================================
          STATUS FILTER (IMPORTANT FIX)
        ===================================================== */
        const isActive =
          b.status === "approved" ||
          b.status === "checked_in" ||
          b.status === "in_progress";

        if (!isActive) {
          return false;
        }

        /* =====================================================
          CHECKOUT EXCLUSION
        ===================================================== */
        if (b.status === "checked_out") {
          return false;
        }

        const match = isInRange(targetDate, start, end);

        if (match) {
          debugMatches.push(b);
        }

        return match;
      });

      /* =====================================================
        DEBUGGER OUTPUT
      ===================================================== */
      console.log("━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📅 DATE:", targetDate.toDateString());
      console.log("📦 BOOKINGS:", availability);
      console.log("🏠 ROOM IDS:", Array.from(roomIds));
      console.log("🔥 MATCHES:", debugMatches);
      console.log("✅ RESULT:", result);
      console.log("━━━━━━━━━━━━━━━━━━━━━━");

      return result;
    },
    [availability, selectedRoom, roomIds, selectedMonth]
  );

  /* =========================================================
    UI
  ========================================================= */
  return (
    <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-800">
          Room Type Availability Calendar
        </h2>

        <span className="text-xs text-gray-400">
          {loading ? "Updating..." : "Live"}
        </span>
      </div>

      {/* =====================================================
        MONTH SELECTOR (NEW FEATURE)
      ===================================================== */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <select
          value={selectedMonth.month}
          onChange={(e) =>
            setSelectedMonth((p) => ({
              ...p,
              month: Number(e.target.value),
            }))
          }
          className="border border-gray-300 p-2 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={selectedMonth.year}
          onChange={(e) =>
            setSelectedMonth((p) => ({
              ...p,
              year: Number(e.target.value),
            }))
          }
          className="border border-gray-300 p-2 rounded-lg w-28 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* ROOM TYPE BUTTONS */}
        <div className="mb-5 flex flex-wrap gap-3">
          {roomTypes.map((type) => {
            const isSelected = selectedRoom === type.id;

            return (
              <button
                key={type.id}
                onClick={() =>
                  setSelectedRoom(isSelected ? null : type.id)
                }
                className={`
                  px-4 py-2 rounded-xl text-sm font-semibold transition
                  border shadow-sm
                  ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }
                `}
              >
                {type.name}
              </button>
            );
          })}
        </div>

      {/* CALENDAR */}
      {!selectedRoom ? (
        <div className="text-gray-400 text-sm italic">
          Select a room type to view availability
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2 text-sm select-none">
          {Array.from({ length: monthDays }).map((_, i) => {
            const day = i + 1;
            const booked = isBooked(day);

            return (
              <div
                key={day}
                className={`p-3 text-center rounded-xl border transition duration-200 hover:scale-[1.03] ${
                  booked
                    ? "bg-red-500/90 text-white border-red-500 shadow-sm"
                    : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                }`}
              >
                <span className="text-xs font-semibold">{day}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}