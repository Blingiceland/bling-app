import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// =====================================================
// POST – Búa til leiðréttingarbeiðni
// =====================================================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === "create") {
            return createCorrection(body);
        } else if (action === "review") {
            return reviewCorrection(body);
        } else {
            return NextResponse.json({ message: "Óþekkt action" }, { status: 400 });
        }
    } catch (error: any) {
        console.error("[CORRECTIONS API] Villa:", error);
        return NextResponse.json(
            { message: "Villa kom upp", error: error.message },
            { status: 500 }
        );
    }
}

// =====================================================
// GET – Sækja leiðréttingarbeiðnir (admin: allar pending, user: sínar)
// =====================================================
export async function GET(req: NextRequest) {
    try {
        const view = req.nextUrl.searchParams.get("view") || "pending";
        const userId = req.nextUrl.searchParams.get("userId");

        if (view === "pending") {
            // Admin: sækja allar pending beiðnir
            const snap = await adminDb
                .collection("correction_requests")
                .where("status", "==", "pending")
                .orderBy("createdAt", "desc")
                .get();

            const requests = snap.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId,
                    displayName: data.displayName,
                    email: data.email,
                    type: data.type,
                    date: data.date,
                    clockIn: data.clockIn || null,
                    clockOut: data.clockOut || null,
                    originalClockIn: data.originalClockIn || null,
                    originalClockOut: data.originalClockOut || null,
                    reason: data.reason,
                    status: data.status,
                    entryId: data.entryId || null,
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                };
            });

            return NextResponse.json({ requests });
        }

        if (view === "all") {
            // Admin: allar beiðnir
            const snap = await adminDb
                .collection("correction_requests")
                .orderBy("createdAt", "desc")
                .limit(100)
                .get();

            const requests = snap.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId,
                    displayName: data.displayName,
                    email: data.email,
                    type: data.type,
                    date: data.date,
                    clockIn: data.clockIn || null,
                    clockOut: data.clockOut || null,
                    originalClockIn: data.originalClockIn || null,
                    originalClockOut: data.originalClockOut || null,
                    reason: data.reason,
                    status: data.status,
                    entryId: data.entryId || null,
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                    reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || null,
                    reviewedBy: data.reviewedBy || null,
                    adminNote: data.adminNote || null,
                };
            });

            return NextResponse.json({ requests });
        }

        return NextResponse.json({ message: "Óþekkt view" }, { status: 400 });
    } catch (error: any) {
        console.error("[CORRECTIONS API] Villa:", error);
        return NextResponse.json(
            { message: "Villa kom upp", error: error.message },
            { status: 500 }
        );
    }
}

// =====================================================
// Búa til leiðréttingarbeiðni (starfsmaður)
// =====================================================
async function createCorrection(body: any) {
    const { userId, displayName, email, type, date, clockIn, clockOut, reason, entryId, originalClockIn, originalClockOut } = body;

    if (!userId || !type || !reason) {
        return NextResponse.json(
            { message: "Vantar nauðsynleg svæði (userId, type, reason)" },
            { status: 400 }
        );
    }

    // type: "missing_punch" (gleymt), "edit_entry" (laga skráningu), "add_entry" (handvirk vakt)
    const correctionRef = await adminDb.collection("correction_requests").add({
        userId,
        displayName,
        email,
        type,
        date: date || null,
        clockIn: clockIn || null,
        clockOut: clockOut || null,
        originalClockIn: originalClockIn || null,
        originalClockOut: originalClockOut || null,
        reason,
        status: "pending",
        entryId: entryId || null,
        createdAt: new Date(),
    });

    return NextResponse.json({
        message: "Leiðréttingarbeiðni send! Admin mun yfirfara hana.",
        id: correctionRef.id,
    });
}

// =====================================================
// Yfirfara beiðni (admin samþykkir/hafnar)
// =====================================================
async function reviewCorrection(body: any) {
    const { correctionId, decision, adminNote, adminEmail } = body;
    // decision: "approved" | "rejected"

    if (!correctionId || !decision) {
        return NextResponse.json(
            { message: "Vantar correctionId og decision" },
            { status: 400 }
        );
    }

    const correctionRef = adminDb.collection("correction_requests").doc(correctionId);
    const correctionDoc = await correctionRef.get();

    if (!correctionDoc.exists) {
        return NextResponse.json({ message: "Beiðni finnst ekki" }, { status: 404 });
    }

    const correctionData = correctionDoc.data()!;

    // Uppfæra stöðu beiðni
    await correctionRef.update({
        status: decision,
        reviewedAt: new Date(),
        reviewedBy: adminEmail || "admin",
        adminNote: adminNote || null,
    });

    // Ef samþykkt, framkvæma breytinguna
    if (decision === "approved") {
        if (correctionData.type === "add_entry" && correctionData.clockIn && correctionData.clockOut) {
            // Búa til nýja tímaskráningu
            const clockInDate = new Date(correctionData.clockIn);
            const clockOutDate = new Date(correctionData.clockOut);
            const totalMinutes = Math.round((clockOutDate.getTime() - clockInDate.getTime()) / 60000);

            await adminDb.collection("time_entries").add({
                userId: correctionData.userId,
                displayName: correctionData.displayName,
                email: correctionData.email,
                clockIn: clockInDate,
                clockOut: clockOutDate,
                totalMinutes,
                breakdown: calculateBreakdown(clockInDate, clockOutDate),
                status: "corrected",
                notes: `Leiðrétt: ${correctionData.reason}`,
                editedBy: adminEmail || "admin",
                correctionId: correctionId,
            });
        } else if (correctionData.type === "edit_entry" && correctionData.entryId) {
            // Uppfæra núverandi tímaskráningu
            const updateData: any = {
                status: "corrected",
                notes: `Leiðrétt: ${correctionData.reason}`,
                editedBy: adminEmail || "admin",
                correctionId: correctionId,
            };

            if (correctionData.clockIn) {
                const newClockIn = new Date(correctionData.clockIn);
                updateData.clockIn = newClockIn;
            }
            if (correctionData.clockOut) {
                const newClockOut = new Date(correctionData.clockOut);
                updateData.clockOut = newClockOut;
            }

            // Endurreikna samtals mínútur
            const entryDoc = await adminDb.collection("time_entries").doc(correctionData.entryId).get();
            if (entryDoc.exists) {
                const entryData = entryDoc.data()!;
                const finalClockIn = updateData.clockIn || entryData.clockIn?.toDate?.() || new Date(entryData.clockIn);
                const finalClockOut = updateData.clockOut || entryData.clockOut?.toDate?.() || new Date(entryData.clockOut);

                if (finalClockIn && finalClockOut) {
                    updateData.totalMinutes = Math.round(
                        (new Date(finalClockOut).getTime() - new Date(finalClockIn).getTime()) / 60000
                    );
                    updateData.breakdown = calculateBreakdown(new Date(finalClockIn), new Date(finalClockOut));
                }
            }

            await adminDb.collection("time_entries").doc(correctionData.entryId).update(updateData);
        }
    }

    return NextResponse.json({
        message: decision === "approved"
            ? "Beiðni samþykkt og leiðrétt!"
            : "Beiðni hafnað.",
    });
}

// =====================================================
// Einfalda útgáfa af breakdown reikninga
// =====================================================
function calculateBreakdown(clockIn: Date, clockOut: Date) {
    // Simplified breakdown - we could import the real logic later
    const totalMinutes = Math.round((clockOut.getTime() - clockIn.getTime()) / 60000);
    const day = clockIn.getDay(); // 0=sun, 6=sat
    const isWeekend = day === 0 || day === 6;

    if (isWeekend) {
        return {
            A_dagvinna: 0,
            B_kvoldvinna: 0,
            C_helgar_fridagar: totalMinutes,
            D_naeturvinna: 0,
        };
    }

    // Simplistic: split into day (before 17:00) and evening (after 17:00)
    const hour = clockIn.getHours();
    const outHour = clockOut.getHours();

    let dagvinna = 0;
    let kvoldvinna = 0;
    let naeturvinna = 0;

    // This is simplified - real calculation would iterate per-minute
    if (hour < 17) {
        const dayEnd = Math.min(outHour >= 17 ? 17 : outHour, 17);
        dagvinna = Math.max(0, (dayEnd - hour) * 60);
    }
    if (outHour >= 17 || outHour < 6) {
        kvoldvinna = totalMinutes - dagvinna;
    }

    return {
        A_dagvinna: Math.max(0, dagvinna),
        B_kvoldvinna: Math.max(0, kvoldvinna),
        C_helgar_fridagar: 0,
        D_naeturvinna: Math.max(0, naeturvinna),
    };
}
