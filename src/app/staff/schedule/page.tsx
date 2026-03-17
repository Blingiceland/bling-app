"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { CalendarDays, ChevronLeft, Loader2 } from "lucide-react";

const DAY_NAMES: Record<string, string> = {
    "0": "Sunnudagur",
    "1": "Mánudagur",
    "2": "Þriðjudagur",
    "3": "Miðvikudagur",
    "4": "Fimmtudagur",
    "5": "Föstudagur",
    "6": "Laugardagur",
};

const DAY_SHORT: Record<string, string> = {
    "0": "Sun",
    "1": "Mán",
    "2": "Þri",
    "3": "Mið",
    "4": "Fim",
    "5": "Fös",
    "6": "Lau",
};

type Shift = { name: string; time: string };
type ScheduleData = Record<string, Shift[]>;

export default function SchedulePage() {
    const { user, loading } = useAuth();
    const [schedule, setSchedule] = useState<ScheduleData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week

    const today = new Date();
    const todayStr = formatDateKey(today);

    // Reikna vikudaga (mánudagur til sunnudagur)
    const baseDate = new Date(today);
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    const weekDays = getWeekDays(baseDate);

    const weekStart = formatDateKey(weekDays[0]);

    useEffect(() => {
        fetchSchedule();
    }, [weekStart]);

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/staff/schedule?weekStart=${weekStart}`);
            const data = await res.json();
            setSchedule(data.schedule?.days || null);
        } catch (err) {
            console.error("Villa:", err);
            setSchedule(null);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center p-4 sm:p-6 pb-20">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center ring-1 ring-amber-500/20">
                            <CalendarDays className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Vaktaplan</h2>
                            <p className="text-stone-500 text-xs">
                                {weekDays[0].toLocaleDateString("is-IS", { day: "numeric", month: "long" })}
                                {" – "}
                                {weekDays[6].toLocaleDateString("is-IS", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
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

                {/* Week Selector */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setWeekOffset(0)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${weekOffset === 0
                            ? "bg-amber-500 text-black"
                            : "bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 border border-white/10"
                            }`}
                    >
                        Þessi vika
                    </button>
                    <button
                        onClick={() => setWeekOffset(1)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${weekOffset === 1
                            ? "bg-amber-500 text-black"
                            : "bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 border border-white/10"
                            }`}
                    >
                        Næsta vika
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                ) : !schedule ? (
                    <div className="text-center py-20">
                        <CalendarDays className="w-16 h-16 text-stone-700 mx-auto mb-4" />
                        <p className="text-stone-400 text-lg font-semibold mb-2">Ekkert vaktaplan</p>
                        <p className="text-stone-600 text-sm">Vaktaplan hefur ekki verið skráð fyrir þessa viku.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop View – Full Table */}
                        <div className="hidden lg:block bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                            <div className="grid grid-cols-7 divide-x divide-white/5">
                                {weekDays.map((day) => {
                                    const key = formatDateKey(day);
                                    const isToday = key === todayStr;
                                    const shifts = schedule[key] || [];
                                    const dayNum = day.getDay().toString();

                                    return (
                                        <div key={key} className={`${isToday ? "bg-amber-500/5" : ""}`}>
                                            {/* Day Header */}
                                            <div className={`px-3 py-3 text-center border-b ${isToday ? "border-amber-500/30 bg-amber-500/10" : "border-white/5"}`}>
                                                <p className={`text-xs font-bold uppercase tracking-wider ${isToday ? "text-amber-500" : "text-stone-500"}`}>
                                                    {DAY_SHORT[dayNum]}
                                                </p>
                                                <p className={`text-lg font-bold ${isToday ? "text-amber-500" : "text-white"}`}>
                                                    {day.getDate()}
                                                </p>
                                            </div>

                                            {/* Shifts */}
                                            <div className="p-2 space-y-1.5 min-h-[180px]">
                                                {shifts.map((shift, i) => (
                                                    <ShiftCard
                                                        key={i}
                                                        name={shift.name}
                                                        time={shift.time}
                                                        isCurrentUser={user?.displayName?.toLowerCase().includes(shift.name.toLowerCase()) || false}
                                                    />
                                                ))}
                                                {shifts.length === 0 && (
                                                    <p className="text-stone-700 text-xs text-center py-6">—</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mobile/Tablet View – Cards */}
                        <div className="lg:hidden space-y-3">
                            {weekDays.map((day) => {
                                const key = formatDateKey(day);
                                const isToday = key === todayStr;
                                const shifts = schedule[key] || [];
                                const dayNum = day.getDay().toString();

                                return (
                                    <div
                                        key={key}
                                        className={`bg-black/40 backdrop-blur-xl border rounded-2xl overflow-hidden ${isToday ? "border-amber-500/30 ring-1 ring-amber-500/20" : "border-white/5"
                                            }`}
                                    >
                                        {/* Day Header */}
                                        <div className={`px-4 py-3 flex items-center justify-between ${isToday ? "bg-amber-500/10" : "bg-white/[0.02]"}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${isToday ? "bg-amber-500 text-black" : "bg-white/5 text-white"
                                                    }`}>
                                                    {day.getDate()}
                                                </div>
                                                <div>
                                                    <p className={`font-bold text-sm ${isToday ? "text-amber-500" : "text-white"}`}>
                                                        {DAY_NAMES[dayNum]}
                                                    </p>
                                                    <p className="text-stone-500 text-xs">
                                                        {day.toLocaleDateString("is-IS", { day: "numeric", month: "long" })}
                                                    </p>
                                                </div>
                                            </div>
                                            {isToday && (
                                                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold ring-1 ring-amber-500/30">
                                                    Í dag
                                                </span>
                                            )}
                                        </div>

                                        {/* Shifts */}
                                        <div className="p-3 space-y-2">
                                            {shifts.map((shift, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${user?.displayName?.toLowerCase().includes(shift.name.toLowerCase())
                                                        ? "bg-amber-500/10 border border-amber-500/20"
                                                        : "bg-white/[0.03] border border-white/5"
                                                        }`}
                                                >
                                                    <span className={`font-semibold text-sm ${user?.displayName?.toLowerCase().includes(shift.name.toLowerCase())
                                                        ? "text-amber-400"
                                                        : "text-white"
                                                        }`}>
                                                        {shift.name}
                                                    </span>
                                                    <span className="text-stone-400 text-sm font-mono">{shift.time}</span>
                                                </div>
                                            ))}
                                            {shifts.length === 0 && (
                                                <p className="text-stone-600 text-sm text-center py-4">Enginn á vakt</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// =====================================================
// Components
// =====================================================

function ShiftCard({ name, time, isCurrentUser }: { name: string; time: string; isCurrentUser: boolean }) {
    return (
        <div
            className={`px-2 py-1.5 rounded-lg text-xs ${isCurrentUser
                ? "bg-amber-500/15 border border-amber-500/30 ring-1 ring-amber-500/10"
                : "bg-white/[0.04] border border-white/5"
                }`}
        >
            <p className={`font-bold truncate ${isCurrentUser ? "text-amber-400" : "text-white"}`}>{name}</p>
            <p className={`${isCurrentUser ? "text-amber-500/70" : "text-stone-500"} font-mono`}>{time}</p>
        </div>
    );
}

// =====================================================
// Helpers
// =====================================================

function formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getWeekDays(date: Date): Date[] {
    const day = date.getDay();
    // Mánudagur = 1, Sunnudagur = 0
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push(d);
    }
    return days;
}
