import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET – Sækja tímaskráningar fyrir notanda
export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get("userId");
        const period = req.nextUrl.searchParams.get("period"); // "2026-03" = launatímabil mars (25. feb – 24. mars)

        if (!userId) {
            return NextResponse.json({ message: "Vantar userId" }, { status: 400 });
        }

        // Reikna launatímabil
        const { startDate, endDate, label } = getPayPeriod(period || getCurrentPeriod());

        // Sækja tímaskráningar
        const entriesSnap = await adminDb
            .collection("time_entries")
            .where("userId", "==", userId)
            .where("clockIn", ">=", startDate)
            .where("clockIn", "<", endDate)
            .orderBy("clockIn", "desc")
            .get();

        const entries = entriesSnap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                clockIn: data.clockIn?.toDate?.()?.toISOString() || null,
                clockOut: data.clockOut?.toDate?.()?.toISOString() || null,
                totalMinutes: data.totalMinutes || 0,
                breakdown: data.breakdown || {},
                status: data.status || "completed",
                notes: data.notes || "",
                editedBy: data.editedBy || null,
                displayName: data.displayName,
            };
        });

        // Reikna samtals
        let totalMinutes = 0;
        const totalBreakdown = {
            A_dagvinna: 0,
            B_kvoldvinna: 0,
            C_helgar_fridagar: 0,
            D_naeturvinna: 0,
        };

        entries.forEach((e) => {
            totalMinutes += e.totalMinutes;
            totalBreakdown.A_dagvinna += e.breakdown?.A_dagvinna || 0;
            totalBreakdown.B_kvoldvinna += e.breakdown?.B_kvoldvinna || 0;
            totalBreakdown.C_helgar_fridagar += e.breakdown?.C_helgar_fridagar || 0;
            totalBreakdown.D_naeturvinna += e.breakdown?.D_naeturvinna || 0;
        });

        // Sækja leiðréttingarbeiðnir
        const correctionsSnap = await adminDb
            .collection("correction_requests")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        const corrections = correctionsSnap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                type: data.type,
                date: data.date,
                clockIn: data.clockIn || null,
                clockOut: data.clockOut || null,
                reason: data.reason,
                status: data.status, // "pending", "approved", "rejected"
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || null,
                reviewedBy: data.reviewedBy || null,
                adminNote: data.adminNote || null,
                entryId: data.entryId || null,
            };
        });

        return NextResponse.json({
            entries,
            corrections,
            totalMinutes,
            totalHours: Math.round((totalMinutes / 60) * 100) / 100,
            totalBreakdown,
            totalBreakdownHours: {
                A_dagvinna: Math.round((totalBreakdown.A_dagvinna / 60) * 100) / 100,
                B_kvoldvinna: Math.round((totalBreakdown.B_kvoldvinna / 60) * 100) / 100,
                C_helgar_fridagar: Math.round((totalBreakdown.C_helgar_fridagar / 60) * 100) / 100,
                D_naeturvinna: Math.round((totalBreakdown.D_naeturvinna / 60) * 100) / 100,
            },
            period: {
                key: period || getCurrentPeriod(),
                label,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            totalShifts: entries.length,
        });
    } catch (error: any) {
        console.error("[TIMESHEET API] Villa:", error);
        return NextResponse.json(
            { message: "Villa kom upp", error: error.message },
            { status: 500 }
        );
    }
}

// =====================================================
// Launatímabil: 25. fyrri mánaðar – 24. þessa mánaðar
// period = "2026-03" þýðir 25. feb – 24. mars
// =====================================================
function getPayPeriod(period: string): { startDate: Date; endDate: Date; label: string } {
    const [year, month] = period.split("-").map(Number);

    // Launatímabil: 25. fyrri mánaðar til 24. þessa mánaðar
    const prevMonth = month - 1 === 0 ? 12 : month - 1;
    const prevYear = month - 1 === 0 ? year - 1 : year;

    const startDate = new Date(prevYear, prevMonth - 1, 25, 0, 0, 0, 0);
    const endDate = new Date(year, month - 1, 25, 0, 0, 0, 0); // 25. þessa mánaðar (exclusive)

    const MONTHS_IS = [
        "", "janúar", "febrúar", "mars", "apríl", "maí", "júní",
        "júlí", "ágúst", "september", "október", "nóvember", "desember"
    ];

    const label = `25. ${MONTHS_IS[prevMonth]} – 24. ${MONTHS_IS[month]} ${year}`;

    return { startDate, endDate, label };
}

function getCurrentPeriod(): string {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1; // 1-indexed

    // Ef dagur er >= 25, þá erum við í næsta tímabili
    if (now.getDate() >= 25) {
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
    }

    return `${year}-${String(month).padStart(2, "0")}`;
}
