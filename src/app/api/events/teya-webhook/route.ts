import { NextResponse } from "next/server";
import { confirmTicketPayment } from "@/lib/event-tickets";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const orderId = formData.get("orderid")?.toString();
        const amount = formData.get("amount")?.toString();
        const currency = formData.get("currency")?.toString();
        const orderHash = formData.get("orderhash")?.toString();
        const authorizationCode = formData.get("authorizationcode")?.toString();
        const actionCode = formData.get("actioncode")?.toString();

        const secretKey = process.env.TEYA_SECRET_KEY || "";

        if (orderId && amount && currency && orderHash) {
            // Verify OrderHash
            const message = `${orderId}|${amount}|${currency}`;
            const hmac = crypto.createHmac("sha256", secretKey);
            hmac.update(message, "utf8");
            const expectedOrderHash = hmac.digest("hex");

            if (expectedOrderHash.toLowerCase() === orderHash.toLowerCase()) {
                if (actionCode === "000") {
                    await confirmTicketPayment(orderId, authorizationCode || "verified");
                    console.log(`Ticket order ${orderId} confirmed via Teya!`);

                    return new NextResponse(
                        "<PaymentNotification>Accepted</PaymentNotification>",
                        {
                            status: 200,
                            headers: { "Content-Type": "text/xml" },
                        }
                    );
                }
            } else {
                console.error(
                    `Hash mismatch for ${orderId}. Expected ${expectedOrderHash}, got ${orderHash}`
                );
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}
