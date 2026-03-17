"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
    Plus,
    Edit3,
    Trash2,
    Calendar,
    Clock,
    MapPin,
    Ticket,
    ArrowLeft,
    Save,
    X,
    Eye,
    EyeOff,
    Users,
    Loader2,
    LogIn,
    BarChart3,
    Upload,
    ImageIcon,
} from "lucide-react";

interface EventItem {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    pricePerTicket: number;
    totalTickets: number;
    ticketsSold: number;
    imageUrl: string;
    status: string;
}

function formatISK(n: number) {
    return n.toLocaleString("is-IS") + " kr.";
}

// Admin email whitelist
const ADMIN_EMAILS = [
    "dillon@dillon.is",
    "jon@dillon.is",
];

export default function EventsAdminPage() {
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Image upload state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [form, setForm] = useState({
        title: "",
        description: "",
        date: "",
        time: "20:00",
        venue: "Dillon",
        pricePerTicket: "",
        totalTickets: "",
        imageUrl: "",
    });

    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

    useEffect(() => {
        if (user) fetchEvents();
    }, [user]);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events/admin");
            const data = await res.json();
            if (data.events) setEvents(data.events);
        } catch (err) {
            console.error("Failed to fetch events:", err);
        }
        setLoading(false);
    };

    const resetForm = () => {
        setForm({
            title: "",
            description: "",
            date: "",
            time: "20:00",
            venue: "Dillon",
            pricePerTicket: "",
            totalTickets: "",
            imageUrl: "",
        });
        setEditingEvent(null);
        setShowForm(false);
        setError("");
        setImageFile(null);
        setImagePreview("");
        setUploadProgress(0);
    };

    const startEdit = (event: EventItem) => {
        setForm({
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            venue: event.venue,
            pricePerTicket: event.pricePerTicket.toString(),
            totalTickets: event.totalTickets.toString(),
            imageUrl: event.imageUrl || "",
        });
        setEditingEvent(event);
        setShowForm(true);
        setImageFile(null);
        setImagePreview(event.imageUrl || "");
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Vinsamlegast veldu myndaskrá (JPG, PNG, WebP)");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("Mynd má ekki vera stærri en 5MB");
            return;
        }

        setImageFile(file);
        setError("");

        // Create preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            setImagePreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const uploadImage = async (): Promise<string> => {
        if (!imageFile) return form.imageUrl;

        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const safeName = imageFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
            const storageRef = ref(storage, `events/${timestamp}_${safeName}`);

            const uploadTask = uploadBytesResumable(storageRef, imageFile);

            setUploading(true);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress = Math.round(
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    );
                    setUploadProgress(progress);
                },
                (error) => {
                    setUploading(false);
                    reject(error);
                },
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    setUploading(false);
                    setUploadProgress(100);
                    resolve(url);
                }
            );
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            // Upload image first if selected
            let finalImageUrl = form.imageUrl;
            if (imageFile) {
                finalImageUrl = await uploadImage();
            }

            const action = editingEvent ? "update" : "create";
            const res = await fetch("/api/events/admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    eventId: editingEvent?.id,
                    eventData: {
                        ...form,
                        imageUrl: finalImageUrl,
                        pricePerTicket: Number(form.pricePerTicket),
                        totalTickets: Number(form.totalTickets),
                    },
                }),
            });
            const data = await res.json();

            if (data.success) {
                setSuccess(
                    editingEvent
                        ? "Viðburður uppfærður!"
                        : "Viðburður búinn til!"
                );
                resetForm();
                fetchEvents();
            } else {
                setError(data.error || "Villa kom upp");
            }
        } catch (err: any) {
            setError(err.message || "Villa kom upp við tengingu");
        }
        setSaving(false);
    };

    const handleToggleStatus = async (event: EventItem) => {
        const newStatus =
            event.status === "active" ? "inactive" : "active";
        try {
            const res = await fetch("/api/events/admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update",
                    eventId: event.id,
                    eventData: { status: newStatus },
                }),
            });
            const data = await res.json();
            if (data.success) {
                fetchEvents();
                setSuccess(
                    `Viðburður ${newStatus === "active" ? "virkjaður" : "óvirkjaður"}`
                );
            }
        } catch {
            setError("Villa við að breyta stöðu");
        }
    };

    const handleDelete = async (event: EventItem) => {
        if (
            !confirm(
                `Ertu viss um að þú viljir eyða „${event.title}"? Þetta setur viðburðinn sem óvirkan.`
            )
        )
            return;

        try {
            const res = await fetch("/api/events/admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "delete",
                    eventId: event.id,
                }),
            });
            const data = await res.json();
            if (data.success) {
                fetchEvents();
                setSuccess("Viðburði eytt!");
            }
        } catch {
            setError("Villa við að eyða viðburði");
        }
    };

    // Auth check
    if (authLoading) {
        return (
            <main className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </main>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 px-6">
                <LogIn className="w-12 h-12 text-accent/50" />
                <h1 className="text-2xl text-white font-bold">
                    Innskráning nauðsynleg
                </h1>
                <button
                    onClick={signInWithGoogle}
                    className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all"
                >
                    Skrá inn með Google
                </button>
            </main>
        );
    }

    if (!isAdmin) {
        return (
            <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 px-6">
                <h1 className="text-2xl text-white font-bold">
                    Aðgangur bannaður
                </h1>
                <p className="text-white/50 text-sm">
                    Þetta netfang ({user.email}) hefur ekki admin aðgang.
                </p>
                <Link
                    href="/events"
                    className="text-accent hover:text-white transition-colors text-sm uppercase tracking-wider font-bold mt-4"
                >
                    ← Til baka á viðburði
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#050505] relative">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[160px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/events"
                            className="text-white/40 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-white font-bold text-lg tracking-wide">
                                Viðburðastjórnun
                            </h1>
                            <p className="text-white/30 text-xs">
                                Admin panel — {user.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Nýr viðburður
                    </button>
                </div>
            </header>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
                {/* Success/Error banners */}
                {success && (
                    <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-4 rounded-xl flex justify-between items-center animate-fade-in">
                        {success}
                        <button
                            onClick={() => setSuccess("")}
                            className="text-green-500/50 hover:text-green-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl flex justify-between items-center animate-fade-in">
                        {error}
                        <button
                            onClick={() => setError("")}
                            className="text-red-500/50 hover:text-red-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Create/Edit Form */}
                {showForm && (
                    <div className="mb-8 bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-2xl p-8 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingEvent
                                    ? "Breyta viðburði"
                                    : "Búa til nýjan viðburð"}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="text-white/30 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Title */}
                            <div>
                                <label className="text-white/50 text-xs uppercase tracking-wider font-bold block mb-2">
                                    Nafn viðburðar *
                                </label>
                                <input
                                    required
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder="t.d. Tónleikar með XYZ"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-white/50 text-xs uppercase tracking-wider font-bold block mb-2">
                                    Lýsing
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            description: e.target.value,
                                        }))
                                    }
                                    rows={3}
                                    placeholder="Stutt lýsing á viðburðinum..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors resize-none"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="text-white/50 text-xs uppercase tracking-wider font-bold block mb-2">
                                    Mynd viðburðar
                                </label>

                                {/* Preview */}
                                {imagePreview && (
                                    <div className="relative mb-3 rounded-xl overflow-hidden border border-white/10 group">
                                        <img
                                            src={imagePreview}
                                            alt="Forskoðun"
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview("");
                                                    setForm(f => ({ ...f, imageUrl: "" }));
                                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                                }}
                                                className="bg-red-500/80 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Fjarlægja
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Upload area */}
                                {!imagePreview && (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-40 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-accent/30 hover:bg-white/[0.02] transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                                            <Upload className="w-5 h-5 text-white/30 group-hover:text-accent transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white/40 text-sm font-medium">
                                                Smelltu til að velja mynd
                                            </p>
                                            <p className="text-white/20 text-xs mt-1">
                                                JPG, PNG eða WebP — hámark 5MB
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />

                                {/* Upload progress */}
                                {uploading && (
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs text-white/40 mb-1">
                                            <span>Hleður upp mynd...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Or paste URL */}
                                {!imagePreview && (
                                    <div className="mt-3">
                                        <div className="flex items-center gap-3 text-white/20 text-xs mb-2">
                                            <div className="flex-1 h-px bg-white/10" />
                                            <span>eða límdu slóð</span>
                                            <div className="flex-1 h-px bg-white/10" />
                                        </div>
                                        <input
                                            value={form.imageUrl}
                                            onChange={(e) => {
                                                setForm((f) => ({
                                                    ...f,
                                                    imageUrl: e.target.value,
                                                }));
                                                if (e.target.value) {
                                                    setImagePreview(e.target.value);
                                                }
                                            }}
                                            placeholder="https://example.com/mynd.jpg"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors text-sm"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Date + Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-white/50 text-xs uppercase tracking-wider font-bold block mb-2">
                                        Dagsetning *
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={form.date}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                date: e.target.value,
                                            }))
                                        }
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-accent/50 focus:outline-none transition-colors [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="text-white/50 text-xs uppercase tracking-wider font-bold block mb-2">
                                        Tími
                                    </label>
                                    <input
                                        type="time"
                                        value={form.time}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                time: e.target.value,
                                            }))
                                        }
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-accent/50 focus:outline-none transition-colors [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            {/* Venue */}
                            <div>
                                <label className="text-white/50 text-xs uppercase tracking-wider font-bold block mb-2">
                                    Staðsetning
                                </label>
                                <input
                                    value={form.venue}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            venue: e.target.value,
                                        }))
                                    }
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-accent/50 focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Price + Tickets */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-white/50 text-xs uppercase tracking-wider font-bold block mb-2">
                                        Verð per miða (ISK) *
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        value={form.pricePerTicket}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                pricePerTicket: e.target.value,
                                            }))
                                        }
                                        placeholder="3000"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-white/50 text-xs uppercase tracking-wider font-bold block mb-2">
                                        Heildarfjöldi miða *
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={form.totalTickets}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                totalTickets: e.target.value,
                                            }))
                                        }
                                        placeholder="100"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-3 border border-white/10 text-white/50 hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors"
                                >
                                    Hætta við
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || uploading}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50"
                                >
                                    {saving || uploading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {uploading
                                        ? "Hleður upp mynd..."
                                        : editingEvent
                                            ? "Vista breytingar"
                                            : "Búa til viðburð"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Stats overview */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                        <BarChart3 className="w-5 h-5 text-accent/50 mb-2" />
                        <span className="text-white/30 text-xs uppercase tracking-wider block">
                            Virkir viðburðir
                        </span>
                        <span className="text-2xl font-black text-white">
                            {events.filter((e) => e.status === "active").length}
                        </span>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                        <Ticket className="w-5 h-5 text-accent/50 mb-2" />
                        <span className="text-white/30 text-xs uppercase tracking-wider block">
                            Seldir miðar
                        </span>
                        <span className="text-2xl font-black text-white">
                            {events.reduce((sum, e) => sum + e.ticketsSold, 0)}
                        </span>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                        <Users className="w-5 h-5 text-accent/50 mb-2" />
                        <span className="text-white/30 text-xs uppercase tracking-wider block">
                            Heildartekjur
                        </span>
                        <span className="text-2xl font-black text-accent">
                            {formatISK(
                                events.reduce(
                                    (sum, e) =>
                                        sum + e.ticketsSold * e.pricePerTicket,
                                    0
                                )
                            )}
                        </span>
                    </div>
                </div>

                {/* Events list */}
                {loading ? (
                    <div className="text-center py-16">
                        <Loader2 className="w-6 h-6 text-white/30 animate-spin mx-auto" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
                        <Calendar className="w-10 h-10 text-white/10 mx-auto mb-4" />
                        <p className="text-white/30 text-sm">
                            Engir viðburðir hafa verið búnir til enn.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 text-accent text-sm font-bold hover:underline"
                        >
                            Búa til fyrsta viðburðinn →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className={`bg-gradient-to-r from-white/[0.03] to-transparent border rounded-2xl overflow-hidden transition-all ${event.status === "active"
                                        ? "border-white/10"
                                        : "border-white/5 opacity-60"
                                    }`}
                            >
                                <div className="flex">
                                    {/* Event thumbnail */}
                                    {event.imageUrl && (
                                        <div className="w-28 md:w-40 shrink-0">
                                            <img
                                                src={event.imageUrl}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-bold text-white truncate">
                                                    {event.title}
                                                </h3>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${event.status === "active"
                                                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                            : "bg-white/5 text-white/30 border border-white/10"
                                                        }`}
                                                >
                                                    {event.status === "active"
                                                        ? "Virkur"
                                                        : "Óvirkur"}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-white/40 text-xs">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {event.date}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {event.time}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {event.venue}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Ticket className="w-3.5 h-3.5" />
                                                    {event.ticketsSold}/{event.totalTickets} seldir
                                                </span>
                                                <span className="text-accent font-bold">
                                                    {formatISK(event.pricePerTicket)}/miði
                                                </span>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-xs">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                                                    style={{
                                                        width: `${event.totalTickets > 0
                                                                ? (event.ticketsSold /
                                                                    event.totalTickets) *
                                                                100
                                                                : 0
                                                            }%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleToggleStatus(event)}
                                                className={`p-2.5 rounded-xl border transition-all ${event.status === "active"
                                                        ? "border-green-500/20 text-green-400 hover:bg-green-500/10"
                                                        : "border-white/10 text-white/30 hover:bg-white/5"
                                                    }`}
                                                title={
                                                    event.status === "active"
                                                        ? "Óvirkja"
                                                        : "Virkja"
                                                }
                                            >
                                                {event.status === "active" ? (
                                                    <Eye className="w-4 h-4" />
                                                ) : (
                                                    <EyeOff className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => startEdit(event)}
                                                className="p-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all"
                                                title="Breyta"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event)}
                                                className="p-2.5 rounded-xl border border-red-500/10 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                title="Eyða"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
