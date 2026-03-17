"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
    Users,
    Clock,
    CalendarDays,
    Activity,
    LogIn as LogInIcon,
    LogOut as LogOutIcon,
    Shield,
    CalendarPlus,
    Plus,
    Trash2,
    Save,
    Mail,
    Check,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    XCircle,
    MessageSquare,
} from "lucide-react";

type Tab = "dashboard" | "staff" | "entries" | "monthly" | "schedule" | "corrections";

type Shift = { name: string; time: string };
type ScheduleDays = Record<string, Shift[]>;

export default function AdminPage() {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>("dashboard");
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

    useEffect(() => {
        if (!user) return;
        if (activeTab === "schedule" || activeTab === "corrections") return; // Þessir tabs sjá um sitt eigið
        fetchData();
    }, [user, activeTab, selectedMonth]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ view: activeTab });
            if (activeTab === "entries" || activeTab === "monthly") {
                params.set("month", selectedMonth);
            }
            const res = await fetch(`/api/staff/admin?${params}`);
            const result = await res.json();
            setData(result);
        } catch (err) {
            console.error("Villa:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <Shield className="w-16 h-16 text-red-500/50 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Aðgangur bannaður</h2>
                <p className="text-stone-400 text-sm">Þú þarft að vera innskráð/ur.</p>
            </div>
        );
    }

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: "dashboard", label: "Yfirlit", icon: Activity },
        { id: "staff", label: "Starfsfólk", icon: Users },
        { id: "entries", label: "Vaktir", icon: Clock },
        { id: "monthly", label: "Mánaðaryfirlit", icon: CalendarDays },
        { id: "schedule", label: "Vaktaplan", icon: CalendarPlus },
        { id: "corrections", label: "Leiðréttingar", icon: ClipboardList },
    ];

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 pb-20 max-w-6xl mx-auto w-full">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-black/40 backdrop-blur-xl rounded-2xl p-1.5 mb-6 border border-white/5 overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                                ? "bg-amber-500 text-black"
                                : "text-stone-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Month Selector (for entries & monthly) */}
            {(activeTab === "entries" || activeTab === "monthly") && (
                <div className="mb-6 flex items-center gap-3">
                    <label className="text-stone-400 text-sm font-medium">Mánuður:</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                </div>
            )}

            {/* Content */}
            {activeTab === "schedule" ? (
                <ScheduleEditor />
            ) : activeTab === "corrections" ? (
                <CorrectionsView user={user} />
            ) : isLoading ? (
                <LoadingSpinner />
            ) : (
                <>
                    {activeTab === "dashboard" && <DashboardView data={data} />}
                    {activeTab === "staff" && <StaffView data={data} />}
                    {activeTab === "entries" && <EntriesView data={data} />}
                    {activeTab === "monthly" && <MonthlyView data={data} />}
                </>
            )}
        </div>
    );
}

// =====================================================
// Schedule Editor (NÝTT!)
// =====================================================
function ScheduleEditor() {
    const [weekOffset, setWeekOffset] = useState(1); // Default: næsta vika
    const [days, setDays] = useState<ScheduleDays>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [staffList, setStaffList] = useState<string[]>([]);
    const [emailSentAt, setEmailSentAt] = useState<string | null>(null);

    const today = new Date();
    const baseDate = new Date(today);
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    const weekDays = getWeekDays(baseDate);
    const weekStart = formatDateKey(weekDays[0]);

    const DAY_NAMES: Record<string, string> = {
        "0": "Sunnudagur",
        "1": "Mánudagur",
        "2": "Þriðjudagur",
        "3": "Miðvikudagur",
        "4": "Fimmtudagur",
        "5": "Föstudagur",
        "6": "Laugardagur",
    };

    useEffect(() => {
        fetchSchedule();
        fetchStaffNames();
    }, [weekStart]);

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/staff/schedule?weekStart=${weekStart}`);
            const data = await res.json();
            if (data.schedule?.days) {
                setDays(data.schedule.days);
                setEmailSentAt(data.schedule.emailSentAt || null);
            } else {
                // Búa til tómt vaktaplan
                const emptyDays: ScheduleDays = {};
                weekDays.forEach((d) => {
                    emptyDays[formatDateKey(d)] = [];
                });
                setDays(emptyDays);
                setEmailSentAt(null);
            }
        } catch (err) {
            console.error("Villa:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStaffNames = async () => {
        try {
            const res = await fetch("/api/staff/admin?view=staff");
            const data = await res.json();
            if (data.staff) {
                setStaffList(data.staff.map((s: any) => s.fullName || s.email).filter(Boolean));
            }
        } catch {
            // Not critical
        }
    };

    const addShift = (dateKey: string) => {
        setDays((prev) => ({
            ...prev,
            [dateKey]: [...(prev[dateKey] || []), { name: "", time: "" }],
        }));
    };

    const removeShift = (dateKey: string, index: number) => {
        setDays((prev) => ({
            ...prev,
            [dateKey]: (prev[dateKey] || []).filter((_, i) => i !== index),
        }));
    };

    const updateShift = (dateKey: string, index: number, field: "name" | "time", value: string) => {
        setDays((prev) => ({
            ...prev,
            [dateKey]: (prev[dateKey] || []).map((s, i) =>
                i === index ? { ...s, [field]: value } : s
            ),
        }));
    };

    const copyFromDay = (fromDateKey: string, toDateKey: string) => {
        setDays((prev) => ({
            ...prev,
            [toDateKey]: [...(prev[fromDateKey] || []).map((s) => ({ ...s }))],
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/staff/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "save", weekStart, days }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: "success", text: data.message });
            } else {
                setMessage({ type: "error", text: data.message });
            }
        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendEmail = async () => {
        if (!confirm("Ertu viss um að þú viljir senda vaktaplanið til alls starfsfólks?")) return;

        // Vista fyrst
        await handleSave();

        setIsSending(true);
        setMessage(null);
        try {
            const res = await fetch("/api/staff/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "sendEmail", weekStart }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: "success", text: data.message });
                setEmailSentAt(new Date().toISOString());
            } else {
                setMessage({ type: "error", text: data.message });
            }
        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Week Selector + Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-2">
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
                    <button
                        onClick={() => setWeekOffset(2)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${weekOffset === 2
                            ? "bg-amber-500 text-black"
                            : "bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 border border-white/10"
                            }`}
                    >
                        + 2 vikur
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Vista
                    </button>
                    <button
                        onClick={handleSendEmail}
                        disabled={isSending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Senda Email
                    </button>
                </div>
            </div>

            {/* Week Info */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-white font-bold">
                        {weekDays[0].toLocaleDateString("is-IS", { day: "numeric", month: "long" })}
                        {" – "}
                        {weekDays[6].toLocaleDateString("is-IS", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-stone-500 text-xs">Vika {getWeekNumber(weekDays[0])}</p>
                </div>
                {emailSentAt && (
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full ring-1 ring-emerald-500/20">
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-bold">
                            Email sent {new Date(emailSentAt).toLocaleDateString("is-IS", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                    </div>
                )}
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
                </div>
            )}

            {/* Day Cards */}
            <div className="space-y-4">
                {weekDays.map((day, dayIndex) => {
                    const dateKey = formatDateKey(day);
                    const dayNum = day.getDay().toString();
                    const shifts = days[dateKey] || [];

                    return (
                        <div key={dateKey} className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                            {/* Day Header */}
                            <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-lg">
                                        {day.getDate()}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">{DAY_NAMES[dayNum]}</p>
                                        <p className="text-stone-500 text-xs">
                                            {day.toLocaleDateString("is-IS", { day: "numeric", month: "long" })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Copy from previous day */}
                                    {dayIndex > 0 && (
                                        <button
                                            onClick={() => copyFromDay(formatDateKey(weekDays[dayIndex - 1]), dateKey)}
                                            className="text-stone-500 hover:text-white text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                                            title="Afrita frá gærdegi"
                                        >
                                            Afrita ↑
                                        </button>
                                    )}
                                    <button
                                        onClick={() => addShift(dateKey)}
                                        className="flex items-center gap-1 text-amber-500 hover:text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Vakt
                                    </button>
                                </div>
                            </div>

                            {/* Shifts */}
                            <div className="p-4 space-y-2">
                                {shifts.map((shift, shiftIndex) => (
                                    <div
                                        key={shiftIndex}
                                        className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-3"
                                    >
                                        {/* Name input with datalist */}
                                        <div className="flex-1 min-w-0">
                                            <input
                                                list={`staff-names-${dateKey}-${shiftIndex}`}
                                                value={shift.name}
                                                onChange={(e) => updateShift(dateKey, shiftIndex, "name", e.target.value)}
                                                placeholder="Nafn starfsmanns..."
                                                className="w-full bg-transparent border-b border-white/10 focus:border-amber-500/50 text-white text-sm px-1 py-1.5 outline-none placeholder:text-stone-600 transition-colors"
                                            />
                                            <datalist id={`staff-names-${dateKey}-${shiftIndex}`}>
                                                {staffList.map((name) => (
                                                    <option key={name} value={name} />
                                                ))}
                                            </datalist>
                                        </div>

                                        {/* Time input */}
                                        <div className="w-44 flex-shrink-0">
                                            <input
                                                value={shift.time}
                                                onChange={(e) => updateShift(dateKey, shiftIndex, "time", e.target.value)}
                                                placeholder="11:15 – 18:00"
                                                className="w-full bg-transparent border-b border-white/10 focus:border-amber-500/50 text-stone-300 text-sm px-1 py-1.5 outline-none font-mono placeholder:text-stone-600 transition-colors"
                                            />
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={() => removeShift(dateKey, shiftIndex)}
                                            className="p-1.5 rounded-lg text-stone-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {shifts.length === 0 && (
                                    <button
                                        onClick={() => addShift(dateKey)}
                                        className="w-full py-4 text-center text-stone-600 hover:text-stone-400 text-sm border border-dashed border-white/10 rounded-xl hover:border-amber-500/30 transition-all"
                                    >
                                        + Bæta við vakt
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-2 pb-8">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-semibold transition-all disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Vista vaktaplan
                </button>
                <button
                    onClick={handleSendEmail}
                    disabled={isSending}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold transition-all disabled:opacity-50"
                >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                    Senda til starfsfólks
                </button>
            </div>
        </div>
    );
}

// =====================================================
// Dashboard View
// =====================================================
function DashboardView({ data }: { data: any }) {
    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                    label="Á vakt núna"
                    value={data.onDutyCount || 0}
                    icon={<Users className="w-5 h-5" />}
                    color="emerald"
                />
                <StatCard
                    label="Nýlegar stimplanir"
                    value={data.recentPunches?.length || 0}
                    icon={<Clock className="w-5 h-5" />}
                    color="amber"
                />
            </div>

            {/* Who's on duty */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    Á vakt núna
                </h3>
                {data.onDuty?.length > 0 ? (
                    <div className="space-y-3">
                        {data.onDuty.map((person: any) => (
                            <div
                                key={person.userId}
                                className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3"
                            >
                                <div>
                                    <p className="text-white font-semibold text-sm">{person.displayName}</p>
                                    <p className="text-stone-500 text-xs">{person.email}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-emerald-400 text-xs font-bold">● INNI</span>
                                    {person.lastPunchTime && (
                                        <p className="text-stone-500 text-xs">
                                            Síðan {new Date(person.lastPunchTime).toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-stone-500 text-sm text-center py-6">Enginn á vakt</p>
                )}
            </div>

            {/* Recent punches */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Nýlegar stimplanir
                </h3>
                <div className="space-y-2">
                    {data.recentPunches?.map((punch: any) => (
                        <div
                            key={punch.id}
                            className="flex items-center justify-between border-b border-white/5 py-2.5 last:border-b-0"
                        >
                            <div className="flex items-center gap-3">
                                {punch.action === "IN" ? (
                                    <LogInIcon className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <LogOutIcon className="w-4 h-4 text-rose-400" />
                                )}
                                <div>
                                    <p className="text-white text-sm font-medium">{punch.displayName}</p>
                                    <p className="text-stone-600 text-xs">{punch.email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs font-bold ${punch.action === "IN" ? "text-emerald-400" : "text-rose-400"}`}>
                                    {punch.action === "IN" ? "INN" : "ÚT"}
                                </span>
                                {punch.timestamp && (
                                    <p className="text-stone-500 text-xs">
                                        {new Date(punch.timestamp).toLocaleString("is-IS", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// =====================================================
// Staff View
// =====================================================
function StaffView({ data }: { data: any }) {
    if (!data?.staff) return null;

    return (
        <div className="space-y-4">
            <p className="text-stone-400 text-sm">{data.staff.length} starfsmenn skráðir</p>
            {data.staff.map((person: any) => (
                <div
                    key={person.userId}
                    className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h4 className="text-white font-bold">{person.fullName}</h4>
                            <p className="text-stone-500 text-sm">{person.email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${person.isActive ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"}`}>
                            {person.isActive ? "Virkur" : "Óvirkur"}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <InfoItem label="Hlutverk" value={person.role} />
                        <InfoItem label="Símanúmer" value={person.phone} />
                        <InfoItem label="Kennitala" value={person.kennitala} />
                        <InfoItem label="Stéttarfélag" value={person.union} />
                        <InfoItem label="Lífeyrissjóður" value={person.pensionFund} />
                        <InfoItem label="Banki" value={person.bank?.fullAccount} />
                    </div>
                    {person.emergency?.name && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1 font-semibold">Neyðartengiliður</p>
                            <p className="text-white text-sm">{person.emergency.name} ({person.emergency.relation}) – {person.emergency.phone}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// =====================================================
// Entries View (Vaktir)
// =====================================================
function EntriesView({ data }: { data: any }) {
    if (!data?.entries) return null;

    return (
        <div className="space-y-4">
            <p className="text-stone-400 text-sm">{data.entries.length} vaktir</p>

            {/* Desktop Table */}
            <div className="hidden sm:block bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left px-4 py-3 text-stone-400 font-semibold text-xs uppercase">Nafn</th>
                            <th className="text-left px-4 py-3 text-stone-400 font-semibold text-xs uppercase">Inn</th>
                            <th className="text-left px-4 py-3 text-stone-400 font-semibold text-xs uppercase">Út</th>
                            <th className="text-right px-4 py-3 text-stone-400 font-semibold text-xs uppercase">Tímar</th>
                            <th className="text-right px-4 py-3 text-stone-400 font-semibold text-xs uppercase">Dag</th>
                            <th className="text-right px-4 py-3 text-stone-400 font-semibold text-xs uppercase">Kvöld</th>
                            <th className="text-right px-4 py-3 text-stone-400 font-semibold text-xs uppercase">Helg</th>
                            <th className="text-right px-4 py-3 text-stone-400 font-semibold text-xs uppercase">Næt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.entries.map((entry: any) => (
                            <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 text-white font-medium">{entry.displayName}</td>
                                <td className="px-4 py-3 text-stone-300">
                                    {entry.clockIn && new Date(entry.clockIn).toLocaleString("is-IS", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td className="px-4 py-3 text-stone-300">
                                    {entry.clockOut && new Date(entry.clockOut).toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td className="px-4 py-3 text-right text-white font-mono font-semibold">
                                    {formatHours(entry.totalMinutes)}
                                </td>
                                <td className="px-4 py-3 text-right text-blue-400 font-mono text-xs">
                                    {formatHours(entry.breakdown?.A_dagvinna)}
                                </td>
                                <td className="px-4 py-3 text-right text-amber-400 font-mono text-xs">
                                    {formatHours(entry.breakdown?.B_kvoldvinna)}
                                </td>
                                <td className="px-4 py-3 text-right text-purple-400 font-mono text-xs">
                                    {formatHours(entry.breakdown?.C_helgar_fridagar)}
                                </td>
                                <td className="px-4 py-3 text-right text-rose-400 font-mono text-xs">
                                    {formatHours(entry.breakdown?.D_naeturvinna)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
                {data.entries.map((entry: any) => (
                    <div key={entry.id} className="bg-black/40 border border-white/5 rounded-2xl p-4">
                        <div className="flex justify-between mb-2">
                            <p className="text-white font-bold text-sm">{entry.displayName}</p>
                            <p className="text-amber-500 font-mono font-bold">{formatHours(entry.totalMinutes)}</p>
                        </div>
                        <p className="text-stone-500 text-xs mb-3">
                            {entry.clockIn && new Date(entry.clockIn).toLocaleString("is-IS", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            {" → "}
                            {entry.clockOut && new Date(entry.clockOut).toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <MiniStat label="Dag" value={formatHours(entry.breakdown?.A_dagvinna)} color="blue" />
                            <MiniStat label="Kvöld" value={formatHours(entry.breakdown?.B_kvoldvinna)} color="amber" />
                            <MiniStat label="Helg" value={formatHours(entry.breakdown?.C_helgar_fridagar)} color="purple" />
                            <MiniStat label="Næt" value={formatHours(entry.breakdown?.D_naeturvinna)} color="rose" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// =====================================================
// Monthly View (Mánaðaryfirlit)
// =====================================================
function MonthlyView({ data }: { data: any }) {
    if (!data?.summaries) return null;

    return (
        <div className="space-y-4">
            <p className="text-stone-400 text-sm">{data.totalStaff} starfsmenn í {data.month}</p>

            {data.summaries.map((s: any) => (
                <div key={s.userId} className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h4 className="text-white font-bold">{s.displayName}</h4>
                            <p className="text-stone-500 text-xs">{s.totalShifts} vaktir</p>
                        </div>
                        <div className="text-right">
                            <p className="text-amber-500 text-2xl font-bold font-mono">{s.totalHours}</p>
                            <p className="text-stone-500 text-xs">klst. samtals</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <BreakdownCard label="Dagvinna" sublabel="11–17 virkir d." hours={s.breakdownHours.A_dagvinna} color="blue" />
                        <BreakdownCard label="Kvöldvinna" sublabel="17–00 virkir d." hours={s.breakdownHours.B_kvoldvinna} color="amber" />
                        <BreakdownCard label="Helgar/Frí" sublabel="Helgar + frídagar" hours={s.breakdownHours.C_helgar_fridagar} color="purple" />
                        <BreakdownCard label="Næturvinna" sublabel="00–06 fös/lau" hours={s.breakdownHours.D_naeturvinna} color="rose" />
                    </div>
                </div>
            ))}

            {data.summaries.length === 0 && (
                <div className="text-center py-12">
                    <CalendarDays className="w-12 h-12 text-stone-700 mx-auto mb-3" />
                    <p className="text-stone-500">Engar vaktir skráðar á þessum mánuði</p>
                </div>
            )}
        </div>
    );
}

// =====================================================
// Helper Components
// =====================================================

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: any; color: string }) {
    const colorMap: Record<string, string> = {
        emerald: "from-emerald-500/10 to-emerald-500/5 ring-emerald-500/20 text-emerald-400",
        amber: "from-amber-500/10 to-amber-500/5 ring-amber-500/20 text-amber-400",
    };
    return (
        <div className={`bg-gradient-to-br ${colorMap[color]} ring-1 rounded-2xl p-5 flex items-center gap-4`}>
            <div className={colorMap[color]}>{icon}</div>
            <div>
                <p className="text-3xl font-bold text-white font-mono">{value}</p>
                <p className="text-stone-400 text-xs font-medium uppercase tracking-wider">{label}</p>
            </div>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-stone-600 uppercase tracking-wider font-semibold mb-0.5">{label}</p>
            <p className="text-stone-300">{value || "–"}</p>
        </div>
    );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
    const colorMap: Record<string, string> = {
        blue: "text-blue-400",
        amber: "text-amber-400",
        purple: "text-purple-400",
        rose: "text-rose-400",
    };
    return (
        <div className="bg-white/5 rounded-lg py-1.5">
            <p className={`${colorMap[color]} font-mono font-bold text-xs`}>{value}</p>
            <p className="text-stone-600 text-[10px]">{label}</p>
        </div>
    );
}

function BreakdownCard({ label, sublabel, hours, color }: { label: string; sublabel: string; hours: number; color: string }) {
    const colorMap: Record<string, string> = {
        blue: "border-blue-500/20 text-blue-400",
        amber: "border-amber-500/20 text-amber-400",
        purple: "border-purple-500/20 text-purple-400",
        rose: "border-rose-500/20 text-rose-400",
    };
    return (
        <div className={`border ${colorMap[color]} rounded-xl p-3 bg-white/[0.02]`}>
            <p className={`${colorMap[color]} text-xl font-bold font-mono`}>{hours}</p>
            <p className="text-white text-xs font-semibold">{label}</p>
            <p className="text-stone-600 text-[10px]">{sublabel}</p>
        </div>
    );
}

function LoadingSpinner() {
    return (
        <div className="flex-1 flex flex-col justify-center items-center h-full">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin"></div>
            <p className="mt-4 text-amber-500/70 text-sm font-medium tracking-widest uppercase">Hleður...</p>
        </div>
    );
}

function formatHours(minutes: number | undefined): string {
    if (!minutes) return "0:00";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${String(m).padStart(2, "0")}`;
}

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getWeekDays(date: Date): Date[] {
    const day = date.getDay();
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

function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// =====================================================
// Corrections View (Leiðréttingar)
// =====================================================
function CorrectionsView({ user }: { user: any }) {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [adminNote, setAdminNote] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [viewMode, setViewMode] = useState<"pending" | "all">("pending");

    useEffect(() => {
        fetchCorrections();
    }, [viewMode]);

    const fetchCorrections = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/staff/corrections?view=${viewMode}`);
            const data = await res.json();
            setRequests(data.requests || []);
        } catch (err) {
            console.error("Villa:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReview = async (correctionId: string, decision: "approved" | "rejected") => {
        try {
            const res = await fetch("/api/staff/corrections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "review",
                    correctionId,
                    decision,
                    adminNote: adminNote.trim() || null,
                    adminEmail: user?.email,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: "success", text: data.message });
                setReviewingId(null);
                setAdminNote("");
                fetchCorrections();
            } else {
                setMessage({ type: "error", text: data.message });
            }
        } catch (err: any) {
            setMessage({ type: "error", text: err.message });
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "add_entry": return "Ný vakt";
            case "edit_entry": return "Breyting á vakt";
            case "missing_punch": return "Gleymd stimplung";
            default: return type;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => setViewMode("pending")}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === "pending"
                        ? "bg-amber-500 text-black"
                        : "bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 border border-white/10"
                        }`}
                >
                    Í vinnslu ({requests.filter((r: any) => r.status === "pending").length || 0})
                </button>
                <button
                    onClick={() => setViewMode("all")}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === "all"
                        ? "bg-amber-500 text-black"
                        : "bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 border border-white/10"
                        }`}
                >
                    Allar beiðnir
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${message.type === "success" ? "bg-emerald-950/40 border-emerald-500/50" : "bg-red-950/40 border-red-500/50"
                    }`}>
                    {message.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <p className={`text-sm font-medium ${message.type === "success" ? "text-emerald-200" : "text-red-200"}`}>
                        {message.text}
                    </p>
                </div>
            )}

            {/* Request Cards */}
            {requests.length === 0 ? (
                <div className="text-center py-16 bg-black/40 border border-white/5 rounded-2xl">
                    <ClipboardList className="w-12 h-12 text-stone-700 mx-auto mb-3" />
                    <p className="text-stone-500">Engar leiðréttingarbeiðnir {viewMode === "pending" ? "í vinnslu" : ""}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((req: any) => (
                        <div
                            key={req.id}
                            className={`bg-black/40 backdrop-blur-xl border rounded-2xl p-5 ${req.status === "pending"
                                    ? "border-amber-500/20"
                                    : req.status === "approved"
                                        ? "border-emerald-500/20"
                                        : "border-red-500/20"
                                }`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-white font-bold">{req.displayName}</p>
                                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-stone-400 text-[10px] font-bold">
                                            {getTypeLabel(req.type)}
                                        </span>
                                    </div>
                                    <p className="text-stone-500 text-xs">{req.email}</p>
                                </div>
                                {req.status === "pending" ? (
                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold ring-1 ring-amber-500/20">
                                        <Clock className="w-3 h-3" />
                                        Í vinnslu
                                    </span>
                                ) : req.status === "approved" ? (
                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold ring-1 ring-emerald-500/20">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Samþykkt
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold ring-1 ring-red-500/20">
                                        <XCircle className="w-3 h-3" />
                                        Hafnað
                                    </span>
                                )}
                            </div>

                            {/* Details */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-3 space-y-1">
                                <p className="text-stone-400 text-xs">
                                    <span className="text-stone-600">Ástæða:</span> {req.reason}
                                </p>
                                {req.date && (
                                    <p className="text-stone-400 text-xs">
                                        <span className="text-stone-600">Dagsetning:</span> {req.date}
                                    </p>
                                )}
                                {req.clockIn && (
                                    <p className="text-stone-400 text-xs font-mono">
                                        <span className="text-stone-600 font-sans">Tími:</span>{" "}
                                        {new Date(req.clockIn).toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit" })}
                                        {req.clockOut && ` → ${new Date(req.clockOut).toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit" })}`}
                                    </p>
                                )}
                                {req.originalClockIn && (
                                    <p className="text-stone-500 text-xs">
                                        <span className="text-stone-600">Upprunalegt:</span>{" "}
                                        {new Date(req.originalClockIn).toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit" })}
                                        {req.originalClockOut && ` → ${new Date(req.originalClockOut).toLocaleTimeString("is-IS", { hour: "2-digit", minute: "2-digit" })}`}
                                    </p>
                                )}
                            </div>

                            {req.createdAt && (
                                <p className="text-stone-600 text-[10px] mb-3">
                                    Sent: {new Date(req.createdAt).toLocaleString("is-IS", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                            )}

                            {req.adminNote && (
                                <p className="text-stone-500 text-xs mb-3 flex items-start gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                    {req.adminNote}
                                </p>
                            )}

                            {/* Action Buttons (only for pending) */}
                            {req.status === "pending" && (
                                <div className="space-y-3">
                                    {reviewingId === req.id ? (
                                        <>
                                            <textarea
                                                value={adminNote}
                                                onChange={(e) => setAdminNote(e.target.value)}
                                                placeholder="Athugasemd (valfrjálst)..."
                                                rows={2}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder:text-stone-600 resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReview(req.id, "approved")}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Samþykkja
                                                </button>
                                                <button
                                                    onClick={() => handleReview(req.id, "rejected")}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-all"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Hafna
                                                </button>
                                                <button
                                                    onClick={() => { setReviewingId(null); setAdminNote(""); }}
                                                    className="px-4 py-2.5 bg-white/5 text-stone-400 hover:text-white rounded-xl text-sm font-semibold transition-all border border-white/10"
                                                >
                                                    Hætta við
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setReviewingId(req.id)}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-xl text-sm font-semibold transition-all"
                                        >
                                            <ClipboardList className="w-4 h-4" />
                                            Yfirfara beiðni
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
