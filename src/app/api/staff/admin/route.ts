import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET – Sækja öll gögn fyrir admin panel
export async function GET(req: NextRequest) {
    try {
        const view = req.nextUrl.searchParams.get("view") || "dashboard";
        const month = req.nextUrl.searchParams.get("month"); // "2026-03"
        const userId = req.nextUrl.searchParams.get("userId");

        switch (view) {
            case "dashboard":
                return getDashboard();
            case "staff":
                return getStaffList();
            case "entries":
                return getTimeEntries(month, userId);
            case "monthly":
                return getMonthlyOverview(month);
            default:
                return NextResponse.json({ message: "Óþekkt view" }, { status: 400 });
        }
    } catch (error: any) {
        console.error("[ADMIN API] Villa:", error);
        return NextResponse.json(
            { message: "Villa kom upp", error: error.message },
            { status: 500 }
        );
    }
}

// =====================================================
// Dashboard – Hverjir eru á vakt núna
// =====================================================
async function getDashboard() {
    // Sækja alla sem eru stimpluðir inn
    const statusSnap = await adminDb
        .collection("staff_status")
        .where("currentStatus", "==", "IN")
        .get();

    const onDuty = statusSnap.docs.map((doc) => ({
        userId: doc.id,
        ...doc.data(),
        lastPunchTime: doc.data().lastPunchTime?.toDate?.()?.toISOString() || null,
    }));

    // Sækja nýjustu stimplanir (síðustu 20)
    const recentSnap = await adminDb
        .collection("time_punches")
        .orderBy("timestamp", "desc")
        .limit(20)
        .get();

    const recentPunches = recentSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({
        onDuty,
        onDutyCount: onDuty.length,
        recentPunches,
    });
}

// =====================================================
// Starfsfólk – Listi yfir allt starfsfólk
// =====================================================
async function getStaffList() {
    const staffSnap = await adminDb
        .collection("staff_users")
        .where("isRegistered", "==", true)
        .get();

    const staff = staffSnap.docs.map((doc) => {
        const data = doc.data();
        return {
            userId: doc.id,
            fullName: data.fullName || data.displayName,
            email: data.email,
            role: data.role,
            phone: data.phone,
            kennitala: data.kennitala,
            isActive: data.isActive,
            isAdmin: data.isAdmin,
            startDate: data.startDate,
            bank: data.bank,
            union: data.union,
            pensionFund: data.pensionFund,
            emergency: data.emergency,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        };
    });

    return NextResponse.json({ staff });
}

// =====================================================
// Tímaskráningar – Lista yfir allar vaktir
// =====================================================
async function getTimeEntries(month: string | null, userId: string | null) {
    let query: any = adminDb
        .collection("time_entries")
        .orderBy("clockIn", "desc");

    // Filter eftir notanda
    if (userId) {
        query = query.where("userId", "==", userId);
    }

    // Filter eftir mánuði
    if (month) {
        const [year, m] = month.split("-").map(Number);
        const startDate = new Date(year, m - 1, 1);
        const endDate = new Date(year, m, 1);
        query = query
            .where("clockIn", ">=", startDate)
            .where("clockIn", "<", endDate);
    }

    const snap = await query.limit(200).get();

    const entries = snap.docs.map((doc: any) => {
        const data = doc.data();
        return {
            id: doc.id,
            userId: data.userId,
            displayName: data.displayName,
            email: data.email,
            clockIn: data.clockIn?.toDate?.()?.toISOString() || null,
            clockOut: data.clockOut?.toDate?.()?.toISOString() || null,
            totalMinutes: data.totalMinutes,
            breakdown: data.breakdown,
            status: data.status,
            notes: data.notes,
            editedBy: data.editedBy,
        };
    });

    return NextResponse.json({ entries });
}

// =====================================================
// Mánaðaryfirlit – Samantekt á hvern starfsmann
// =====================================================
async function getMonthlyOverview(month: string | null) {
    const targetMonth = month || getCurrentMonth();
    const [year, m] = targetMonth.split("-").map(Number);
    const startDate = new Date(year, m - 1, 1);
    const endDate = new Date(year, m, 1);

    // Sækja allar vaktir þennan mánuð
    const snap = await adminDb
        .collection("time_entries")
        .where("clockIn", ">=", startDate)
        .where("clockIn", "<", endDate)
        .get();

    // Safna saman eftir starfsmanni
    const summaryMap: Record<string, any> = {};

    snap.docs.forEach((doc) => {
        const data = doc.data();
        const uid = data.userId;

        if (!summaryMap[uid]) {
            summaryMap[uid] = {
                userId: uid,
                displayName: data.displayName,
                email: data.email,
                totalMinutes: 0,
                totalShifts: 0,
                breakdown: {
                    A_dagvinna: 0,
                    B_kvoldvinna: 0,
                    C_helgar_fridagar: 0,
                    D_naeturvinna: 0,
                },
            };
        }

        summaryMap[uid].totalMinutes += data.totalMinutes || 0;
        summaryMap[uid].totalShifts += 1;

        if (data.breakdown) {
            summaryMap[uid].breakdown.A_dagvinna += data.breakdown.A_dagvinna || 0;
            summaryMap[uid].breakdown.B_kvoldvinna += data.breakdown.B_kvoldvinna || 0;
            summaryMap[uid].breakdown.C_helgar_fridagar += data.breakdown.C_helgar_fridagar || 0;
            summaryMap[uid].breakdown.D_naeturvinna += data.breakdown.D_naeturvinna || 0;
        }
    });

    const summaries = Object.values(summaryMap).map((s: any) => ({
        ...s,
        totalHours: Math.round((s.totalMinutes / 60) * 100) / 100,
        breakdownHours: {
            A_dagvinna: Math.round((s.breakdown.A_dagvinna / 60) * 100) / 100,
            B_kvoldvinna: Math.round((s.breakdown.B_kvoldvinna / 60) * 100) / 100,
            C_helgar_fridagar: Math.round((s.breakdown.C_helgar_fridagar / 60) * 100) / 100,
            D_naeturvinna: Math.round((s.breakdown.D_naeturvinna / 60) * 100) / 100,
        },
    }));

    return NextResponse.json({
        month: targetMonth,
        summaries,
        totalStaff: summaries.length,
    });
}

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
