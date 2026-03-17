import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            userId,
            email,
            photoURL,
            fullName,
            kennitala,
            phone,
            address,
            role,
            startDate,
            bankNumber,
            ledger,
            accountNumber,
            union,
            pensionFund,
            personalPensionPct,
            emergencyName,
            emergencyPhone,
            emergencyRelation,
        } = body;

        if (!userId || !email || !fullName || !kennitala) {
            return NextResponse.json(
                { message: "Vantar nauðsynlegar upplýsingar (nafn, kennitala)." },
                { status: 400 }
            );
        }

        // Vista í Firestore
        await adminDb
            .collection("staff_users")
            .doc(userId)
            .set(
                {
                    email,
                    photoURL: photoURL || null,
                    fullName,
                    displayName: fullName,
                    kennitala,
                    phone: phone || "",
                    address: address || "",
                    role: role || "Barþjónn",
                    startDate: startDate || null,
                    bank: {
                        bankNumber: bankNumber || "",
                        ledger: ledger || "",
                        accountNumber: accountNumber || "",
                        // Fullt reikningsnúmer: 0000-00-000000
                        fullAccount: `${bankNumber || ""}-${ledger || ""}-${accountNumber || ""}`,
                    },
                    union: union || "",
                    pensionFund: pensionFund || "",
                    personalPensionPct: parseFloat(personalPensionPct) || 0,
                    emergency: {
                        name: emergencyName || "",
                        phone: emergencyPhone || "",
                        relation: emergencyRelation || "",
                    },
                    isActive: true,
                    isAdmin: false,
                    isRegistered: true,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

        console.log(
            `[REGISTER] ✅ Starfsmaður skráður: ${fullName} (${email})`
        );

        return NextResponse.json({
            success: true,
            message: "Skráning tókst!",
        });
    } catch (error: any) {
        console.error("[REGISTER] Villa:", error);
        return NextResponse.json(
            { message: "Villa kom upp við skráningu.", error: error.message },
            { status: 500 }
        );
    }
}

// GET - Athuga hvort notandi sé skráður
export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { message: "Vantar userId" },
                { status: 400 }
            );
        }

        const userDoc = await adminDb
            .collection("staff_users")
            .doc(userId)
            .get();

        if (!userDoc.exists || !userDoc.data()?.isRegistered) {
            return NextResponse.json({ isRegistered: false });
        }

        return NextResponse.json({
            isRegistered: true,
            profile: userDoc.data(),
        });
    } catch (error: any) {
        console.error("[REGISTER CHECK] Villa:", error);
        return NextResponse.json(
            { message: "Villa kom upp", error: error.message },
            { status: 500 }
        );
    }
}
