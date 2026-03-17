import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const orderId = formData.get("orderid")?.toString();

        if (orderId) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
            return NextResponse.redirect(`${baseUrl}/events/success?id=${orderId}`, 302);
        }

        return NextResponse.redirect(new URL("/events", request.url), 302);
    } catch (err) {
        console.error("teya-return-success error", err);
        return NextResponse.redirect(new URL("/events/error", request.url), 302);
    }
}
