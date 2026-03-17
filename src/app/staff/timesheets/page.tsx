"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
    Clock,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Plus,
    Edit3,
    Send,
    CheckCircle2,
    XCircle,
    AlertCircle,
    HelpCircle,
    X,
} from "lucide-react";

type TimeEntry = {
    id: string;
    clockIn: string | null;
    clockOut: string | null;
    totalMinutes: number;
    breakdown: Record<string, number>;
    status: string;
    notes: string;
    editedBy: string | null;
    displayName: string;
};

type CorrectionRequest = {
    id: string;
    type: string;
    date: string | null;
    clockIn: string | null;
    clockOut: string | null;
    reason: string;
    status: string;
    createdAt: string | null;
    reviewedAt: string | null;
    adminNote: string | null;
};

export default function TimesheetsPage() {
    const { user, loading } = useAuth();
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState(getCurrentPeriod());
    const [showCorrectionForm, setShowCorrectionForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (user) fetchData();
    }, [user, period]);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/staff/timesheet?userId=${user.uid}&period=${period}`);
            const data = await res.json();
            setEntries(data.entries || []);
            setCorrections(data.corrections || []);
            setSummary(data);
        } catch (err) {
            console.error("Villa:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const navigatePeriod = (direction: number) => {
        const [y, m] = period.split("-").map(Number);
        let newMonth = m + direction;
        let newYear = y;
        if (newMonth > 12) { newMonth = 1; newYear++; }
        if (newMonth < 1) { newMonth = 12; newYear--; }
        setPeriod(`${newYear}-${String(newMonth).padStart(2, "0")}`);
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <p className="text-stone-400">Þú þarft að vera innskráð/ur.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-4 sm:p-6 pb-20">
            <div className="w-full max-w-3xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center ring-1 ring-blue-500/20">
                            <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Tímaskráningar</h2>
                            <p className="text-stone-500 text-xs">Launatímabil</p>
                        </div>
                    </div>
                    <a
                        href="/staff"
                        className="text-stone-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Til baka
                    </a>
                </div>

                {/* Period Navigator */}
                <div className="flex items-center justify-between bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4">
                    <button
                        onClick={() => navigatePeriod(-1)}
                        className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                        <p className="text-white font-bold text-sm">{summary?.period?.label || "Hleður..."}</p>
                        <p className="text-stone-500 text-xs">Launatímabil</p>
                    </div>
                    <button
                        onClick={() => navigatePeriod(1)}
                        className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                {message && (
                    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${message.type === "success"
                        ? "bg-emerald-950/40 border-emerald-500/50"
                        : "bg-red-950/40 border-red-500/50"
                        }`}>
                        {message.type === "success" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        )}
                        <p className={`text-sm font-medium ${message.type === "success" ? "text-emerald-200" : "text-red-200"}`}>
                            {message.text}
                        </p>
                        <button onClick={() => setMessage(null)} className="ml-auto text-stone-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <SummaryCard label="Samtals" value={formatH(summary?.totalMinutes)} color="amber" large />
                            <SummaryCard label="Dagvinna" value={formatH(summary?.totalBreakdown?.A_dagvinna)} color="blue" />
                            <SummaryCard label="Kvöldvinna" value={formatH(summary?.totalBreakdown?.B_kvoldvinna)} color="amber" />
                            <SummaryCard label="Helgar/Frí" value={formatH(summary?.totalBreakdown?.C_helgar_fridagar)} color="purple" />
                            <SummaryCard label="Næturvinna" value={formatH(summary?.totalBreakdown?.D_naeturvinna)} color="rose" />
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={() => { setEditingEntry(null); setShowCorrectionForm(true); }}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-2xl font-semibold text-sm transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Bæta við vakt / Senda leiðréttingu
                        </button>

                        {/* Entries List */}
                        <div className="space-y-2">
                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-amber-500" />
                                Vaktir ({entries.length})
                            </h3>

                            {entries.length === 0 ? (
                                <div className="text-center py-12 bg-black/40 border border-white/5 rounded-2xl">
                                    <Clock className="w-12 h-12 text-stone-700 mx-auto mb-3" />
                                    <p className="text-stone-500 text-sm">Engar vaktir á þessu tímabili</p>
                                </div>
                            ) : (
                                entries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className={`bg-black/40 backdrop-blur-xl border rounded-2xl p-4 ${entry.status === "corrected"
                                            ? "border-blue-500/20"
                                            : "border-white/5"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-white font-bold text-sm">
                                                    {entry.clockIn
                                                        ? new Date(entry.clockIn).toLocaleDateString("is-IS", {
                                                            weekday: "long",
                                                            day: "numeric",
                                                            month: "long",
                                                        })
                                                        : "Óþekkt dagur"}
                                                </p>
                                                <p className="text-stone-400 text-xs font-mono">
                                                    {entry.clockIn && new Date(entry.clockIn).toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit" })}
                                                    {" → "}
                                                    {entry.clockOut
                                                        ? new Date(entry.clockOut).toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit" })
                                                        : "—"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {entry.status === "corrected" && (
                                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold ring-1 ring-blue-500/20">
                                                        LEIÐRÉTT
                                                    </span>
                                                )}
                                                <p className="text-amber-500 font-mono font-bold text-lg">
                                                    {formatH(entry.totalMinutes)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Breakdown mini */}
                                        <div className="grid grid-cols-4 gap-2 mb-2">
                                            <MiniBreakdown label="Dag" value={entry.breakdown?.A_dagvinna} color="blue" />
                                            <MiniBreakdown label="Kvöld" value={entry.breakdown?.B_kvoldvinna} color="amber" />
                                            <MiniBreakdown label="Helg" value={entry.breakdown?.C_helgar_fridagar} color="purple" />
                                            <MiniBreakdown label="Næt" value={entry.breakdown?.D_naeturvinna} color="rose" />
                                        </div>

                                        {entry.notes && (
                                            <p className="text-stone-500 text-xs italic">{entry.notes}</p>
                                        )}

                                        {/* Edit button */}
                                        <button
                                            onClick={() => { setEditingEntry(entry); setShowCorrectionForm(true); }}
                                            className="mt-2 flex items-center gap-1.5 text-stone-500 hover:text-amber-400 text-xs transition-colors"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Óska eftir leiðréttingu
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pending Corrections */}
                        {corrections.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-blue-400" />
                                    Leiðréttingarbeiðnir
                                </h3>

                                {corrections.map((c) => (
                                    <div
                                        key={c.id}
                                        className={`bg-black/40 border rounded-2xl p-4 ${c.status === "pending"
                                            ? "border-amber-500/20"
                                            : c.status === "approved"
                                                ? "border-emerald-500/20"
                                                : "border-red-500/20"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-white text-sm font-semibold">
                                                    {c.type === "add_entry" ? "Ný vakt" : "Leiðrétting"}
                                                </p>
                                                <p className="text-stone-500 text-xs">{c.reason}</p>
                                            </div>
                                            <StatusBadge status={c.status} />
                                        </div>
                                        {c.clockIn && (
                                            <p className="text-stone-400 text-xs font-mono">
                                                {new Date(c.clockIn).toLocaleString("is-IS", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                {c.clockOut && ` → ${new Date(c.clockOut).toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit" })}`}
                                            </p>
                                        )}
                                        {c.adminNote && (
                                            <p className="text-stone-500 text-xs mt-2 italic">Admin: {c.adminNote}</p>
                                        )}
                                        {c.createdAt && (
                                            <p className="text-stone-600 text-[10px] mt-1">
                                                Sent: {new Date(c.createdAt).toLocaleString("is-IS", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Correction Modal */}
            {showCorrectionForm && (
                <CorrectionModal
                    user={user}
                    entry={editingEntry}
                    onClose={() => { setShowCorrectionForm(false); setEditingEntry(null); }}
                    onSuccess={(msg) => {
                        setMessage({ type: "success", text: msg });
                        setShowCorrectionForm(false);
                        setEditingEntry(null);
                        fetchData();
                    }}
                    onError={(msg) => {
                        setMessage({ type: "error", text: msg });
                    }}
                />
            )}
        </div>
    );
}

// =====================================================
// Correction Modal
// =====================================================
function CorrectionModal({
    user,
    entry,
    onClose,
    onSuccess,
    onError,
}: {
    user: any;
    entry: TimeEntry | null;
    onClose: () => void;
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}) {
    const isEdit = !!entry;
    const [type, setType] = useState(isEdit ? "edit_entry" : "add_entry");
    const [date, setDate] = useState(
        isEdit && entry?.clockIn
            ? new Date(entry.clockIn).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0]
    );
    const [clockIn, setClockIn] = useState(
        isEdit && entry?.clockIn
            ? new Date(entry.clockIn).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : ""
    );
    const [clockOut, setClockOut] = useState(
        isEdit && entry?.clockOut
            ? new Date(entry.clockOut).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : ""
    );
    const [reason, setReason] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            onError("Þú þarft að skrifa ástæðu.");
            return;
        }

        setIsSending(true);
        try {
            const clockInFull = clockIn ? `${date}T${clockIn}:00` : null;
            const clockOutFull = clockOut ? `${date}T${clockOut}:00` : null;

            // Handle overnight shifts
            let adjustedClockOut = clockOutFull;
            if (clockInFull && clockOutFull && new Date(clockOutFull) < new Date(clockInFull)) {
                const nextDay = new Date(date);
                nextDay.setDate(nextDay.getDate() + 1);
                adjustedClockOut = `${nextDay.toISOString().split("T")[0]}T${clockOut}:00`;
            }

            const res = await fetch("/api/staff/corrections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create",
                    userId: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    type,
                    date,
                    clockIn: clockInFull,
                    clockOut: adjustedClockOut,
                    reason,
                    entryId: entry?.id || null,
                    originalClockIn: entry?.clockIn || null,
                    originalClockOut: entry?.clockOut || null,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                onSuccess(data.message);
            } else {
                onError(data.message);
            }
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#111611] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                        {isEdit ? "Óska eftir leiðréttingu" : "Bæta við vakt"}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-xl text-stone-500 hover:text-white hover:bg-white/5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!isEdit && (
                    <div>
                        <label className="text-stone-400 text-xs font-semibold uppercase tracking-wider block mb-2">Tegund</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setType("add_entry")}
                                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${type === "add_entry"
                                    ? "bg-amber-500 text-black"
                                    : "bg-white/5 text-stone-400 border border-white/10"
                                    }`}
                            >
                                Ný vakt
                            </button>
                            <button
                                onClick={() => setType("missing_punch")}
                                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${type === "missing_punch"
                                    ? "bg-amber-500 text-black"
                                    : "bg-white/5 text-stone-400 border border-white/10"
                                    }`}
                            >
                                Gleymd stimplung
                            </button>
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-stone-400 text-xs font-semibold uppercase tracking-wider block mb-2">Dagsetning</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-stone-400 text-xs font-semibold uppercase tracking-wider block mb-2">Inn</label>
                        <input
                            type="time"
                            value={clockIn}
                            onChange={(e) => setClockIn(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                    </div>
                    <div>
                        <label className="text-stone-400 text-xs font-semibold uppercase tracking-wider block mb-2">Út</label>
                        <input
                            type="time"
                            value={clockOut}
                            onChange={(e) => setClockOut(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-stone-400 text-xs font-semibold uppercase tracking-wider block mb-2">Ástæða *</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="T.d. Gleymdi að stimpla mig inn..."
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder:text-stone-600 resize-none"
                    />
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                    <p className="text-amber-400/80 text-xs">
                        ⚠️ Yfirmaður þarf að samþykkja allar leiðréttingar. Þú færð tilkynningu þegar beiðnin hefur verið yfirfarin.
                    </p>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSending}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
                >
                    {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    Senda beiðni
                </button>
            </div>
        </div>
    );
}

// =====================================================
// Helper Components
// =====================================================

function SummaryCard({ label, value, color, large }: { label: string; value: string; color: string; large?: boolean }) {
    const colorMap: Record<string, string> = {
        amber: "text-amber-400 ring-amber-500/20 bg-amber-500/5",
        blue: "text-blue-400 ring-blue-500/20 bg-blue-500/5",
        purple: "text-purple-400 ring-purple-500/20 bg-purple-500/5",
        rose: "text-rose-400 ring-rose-500/20 bg-rose-500/5",
    };
    return (
        <div className={`${colorMap[color]} ring-1 rounded-2xl p-3 text-center ${large ? "col-span-2 sm:col-span-1" : ""}`}>
            <p className={`font-mono font-bold ${large ? "text-2xl" : "text-lg"} text-white`}>{value}</p>
            <p className={`text-xs font-medium ${colorMap[color].split(" ")[0]}`}>{label}</p>
        </div>
    );
}

function MiniBreakdown({ label, value, color }: { label: string; value: number; color: string }) {
    const colorMap: Record<string, string> = {
        blue: "text-blue-400",
        amber: "text-amber-400",
        purple: "text-purple-400",
        rose: "text-rose-400",
    };
    const h = value ? `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}` : "0:00";
    return (
        <div className="bg-white/[0.03] rounded-lg py-1 text-center">
            <p className={`${colorMap[color]} font-mono font-bold text-xs`}>{h}</p>
            <p className="text-stone-600 text-[10px]">{label}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "pending") {
        return (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold ring-1 ring-amber-500/20">
                <Clock className="w-3 h-3" />
                Í vinnslu
            </span>
        );
    }
    if (status === "approved") {
        return (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold ring-1 ring-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Samþykkt
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold ring-1 ring-red-500/20">
            <XCircle className="w-3 h-3" />
            Hafnað
        </span>
    );
}

function formatH(minutes: number | undefined): string {
    if (!minutes) return "0:00";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${String(m).padStart(2, "0")}`;
}

function getCurrentPeriod(): string {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    if (now.getDate() >= 25) {
        month += 1;
        if (month > 12) { month = 1; year += 1; }
    }
    return `${year}-${String(month).padStart(2, "0")}`;
}
