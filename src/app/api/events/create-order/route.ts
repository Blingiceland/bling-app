import { NextResponse } from "next/server";
import { createTicketOrder, getEvent } from "@/lib/event-tickets";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { eventId, ticketCount, userId, userEmail, userName } = body;

        if (!eventId || !ticketCount || !userId || !userEmail || !userName) {
            return NextResponse.json({ error: "Vantar nauðsynleg svið" }, { status: 400 });
        }

        const event = await getEvent(eventId);
        if (!event) {
            return NextResponse.json({ error: "Viðburður fannst ekki" }, { status: 404 });
        }

        const { id, amount } = await createTicketOrder({
            eventId,
            ticketCount: Number(ticketCount),
            userId,
            userEmail,
            userName,
            totalAmount: 0, // Will be calculated in createTicketOrder
        });

        // Teya (Borgun) SecurePay
        const merchantId = process.env.TEYA_MERCHANT_ID || "";
        const gatewayId = process.env.TEYA_GATEWAY_ID || "";
        const secretKey = process.env.TEYA_SECRET_KEY || "";
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        const returnUrlSuccess = `${baseUrl}/api/events/teya-return-success`;
        const returnUrlSuccessServer = `${baseUrl}/api/events/teya-webhook`;
        const returnUrlCancel = `${baseUrl}/api/events/teya-return-error`;
        const returnUrlError = `${baseUrl}/api/events/teya-return-error`;

        const currency = "ISK";
        const orderId = id;

        // Calculate HMAC CheckHash
        const message = `${merchantId}|${returnUrlSuccess}|${returnUrlSuccessServer}|${orderId}|${amount}|${currency}`;
        const hmac = crypto.createHmac("sha256", secretKey);
        hmac.update(message, "utf8");
        const checkHash = hmac.digest("hex");

        const paymentPayload = {
            url: "https://test.borgun.is/SecurePay/default.aspx", // TEST URL
            fields: {
                merchantid: merchantId,
                paymentgatewayid: gatewayId,
                checkhash: checkHash,
                orderid: orderId,
                currency: currency,
                language: "IS",
                buyername: userName,
                buyeremail: userEmail,
                returnurlsuccess: returnUrlSuccess,
                returnurlsuccessserver: returnUrlSuccessServer,
                returnurlcancel: returnUrlCancel,
                returnurlerror: returnUrlError,
                amount: amount.toString(),
                itemdescription_0: `${event.title} - ${ticketCount} miðar`,
                itemcount_0: ticketCount.toString(),
                itemunitamount_0: event.pricePerTicket.toString(),
                itemamount_0: amount.toString(),
            },
        };

        return NextResponse.json({
            success: true,
            id,
            amount,
            paymentPayload,
        });
    } catch (error: any) {
        console.error("Error creating ticket order:", error);
        return NextResponse.json(
            { error: error.message || "Pöntun mistókst" },
            { status: 500 }
        );
    }
}
