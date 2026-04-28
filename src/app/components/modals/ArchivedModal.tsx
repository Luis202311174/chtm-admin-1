'use client';

import { useEffect } from 'react';

interface Props {
  open: boolean;
  booking: any | null;
  onClose: () => void;
  formatDate: (date: string | null | undefined) => string;
}

/* =========================================================
  MAIN MODAL
========================================================= */

export default function ArchivedModal({
  open,
  booking,
  onClose,
  formatDate,
}: Props) {

  /* =========================================================
    ESC CLOSE
  ========================================================= */
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !booking) return null;

  /* =========================================================
    GUEST NAME
  ========================================================= */
  const guestName =
    `${booking.guest_fname ?? ''} ${booking.guest_lname ?? ''}`.trim() ||
    'Unknown Guest';

  /* =========================================================
    ROOM DISPLAY (ARCHIVE SNAPSHOT SAFE)
  ========================================================= */
  const roomLabel =
    booking.room_type_name ||
    (booking.room_number ? `Room ${booking.room_number}` : 'Room N/A');

  /* =========================================================
    FORMAT USER
  ========================================================= */
  const formatUser = (user?: any) =>
    user ? `${user.fname ?? ''} ${user.lname ?? ''}`.trim() : '—';

  const approvedBy = formatUser(booking.approved_by_user);
  const checkedInBy = formatUser(booking.checked_in_by_user);
  const checkedOutBy = formatUser(booking.checked_out_by_user);

  /* =========================================================
    SAFE NUMBERS
  ========================================================= */
  const totalAmount = Number(booking.total_amount ?? 0);
  const extraBeds = booking.extra_beds ?? 0;
  const guests = booking.guests ?? 0;

  const money = (value: number) =>
    `₱${value.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
    })}`;

  /* =========================================================
    UI
  ========================================================= */
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      {/* BACKDROP CLOSE */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white w-11/12 md:w-2/3 lg:w-1/2 rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          ✖
        </button>

        {/* HEADER */}
        <div className="mb-6 border-b pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{guestName}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Archived Booking Details
              </p>
            </div>

            <span className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-semibold rounded-full tracking-wide">
              Archived
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* LEFT */}
          <div className="space-y-4">

            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <p className="text-sm text-indigo-600 font-medium mb-1">Room / Type</p>
              <p className="text-xl font-bold text-indigo-900">{roomLabel}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Check-in</span>
                <span className="font-semibold">{formatDate(booking.checked_in_at)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Check-out</span>
                <span className="font-semibold">{formatDate(booking.checked_out_at)}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-green-600">{money(totalAmount)}</p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">Payment</p>
                <p className="font-semibold">{booking.payment_method ?? '—'}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Guests</p>
                <p className="text-lg font-semibold">{guests}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Extra Beds</p>
                <p className="text-lg font-semibold">{extraBeds}</p>
              </div>
            </div>

          </div>

          {/* RIGHT */}
          <div className="space-y-4">

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">
                Staff Activity
              </h3>

              <div className="flex justify-between">
                <span className="text-gray-500">Approved By</span>
                <span className="font-semibold">{approvedBy}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Checked In By</span>
                <span className="font-semibold">{checkedInBy}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Checked Out By</span>
                <span className="font-semibold">{checkedOutBy}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-3 gap-2 text-center">

              <div>
                <p className="text-xs text-gray-500 mb-1">Child</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  booking.has_child ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {booking.has_child ? 'YES' : 'NO'}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">PWD</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  booking.has_pwd ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {booking.has_pwd ? 'YES' : 'NO'}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Senior</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  booking.has_senior ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {booking.has_senior ? 'YES' : 'NO'}
                </span>
              </div>

            </div>

            {booking.message && (
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                <p className="text-sm text-yellow-700 font-medium mb-1">
                  Guest Message
                </p>
                <p className="italic text-yellow-900">
                  "{booking.message}"
                </p>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}