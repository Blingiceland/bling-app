import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { transporter, FROM_EMAIL, BCC_EMAIL } from "@/lib/mailer";

function formatISK(n: number) {
    return n.toLocaleString("is-IS") + " kr.";
}

function buildReceiptHTML(order: any, event: any): string {
    const {
        userName, userEmail, ticketCount, totalAmount,
        teyaPaymentId, id
    } = order;

    const invoiceRef = id?.slice(0, 8).toUpperCase() || "—";
    const now = new Date();
    const issuedDate = now.toLocaleDateString("is-IS", {
        day: "2-digit", month: "2-digit", year: "numeric"
    });

    return `
<!DOCTYPE html>
<html lang="is">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;overflow:hidden;border:1px solid #222;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0a0e,#0d1a1a);padding:40px 40px 30px;text-align:center;border-bottom:1px solid #222;">
              <div style="font-size:32px;font-weight:900;letter-spacing:6px;color:#fff;text-transform:uppercase;">DILLON</div>
              <div style="font-size:11px;letter-spacing:4px;color:#d4af37;text-transform:uppercase;margin-top:4px;">VIÐBURÐIR</div>
              <div style="margin-top:20px;display:inline-block;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);border-radius:20px;padding:6px 18px;">
                <span style="color:#d4af37;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">🎫 Miðapöntun Staðfest</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <p style="color:#ccc;font-size:15px;margin:0 0 24px;">Hæ ${userName}! Greiðsla tókst og miðarnir þínir eru bókaðir. Við hlökkum til að sjá þig! 🎉</p>

              <!-- Invoice meta -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Pöntunarnúmer</td>
                  <td align="right" style="color:#fff;font-size:12px;font-weight:700;font-family:monospace;">#EVT-${invoiceRef}</td>
                </tr>
                <tr>
                  <td style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-top:6px;">Útgáfudagur</td>
                  <td align="right" style="color:#fff;font-size:12px;padding-top:6px;">${issuedDate}</td>
                </tr>
                ${teyaPaymentId ? `
                <tr>
                  <td style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-top:6px;">Greiðslutilvísun</td>
                  <td align="right" style="color:#fff;font-size:12px;padding-top:6px;font-family:monospace;">${teyaPaymentId}</td>
                </tr>` : ""}
              </table>

              <!-- Event details -->
              <div style="background:#1a1a1a;border-radius:12px;padding:20px 24px;margin-bottom:24px;border:1px solid #2a2a2a;">
                <div style="color:#d4af37;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Viðburður</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#888;font-size:13px;padding:4px 0;">Viðburður</td>
                    <td align="right" style="color:#fff;font-size:13px;font-weight:600;">${event.title}</td>
                  </tr>
                  <tr>
                    <td style="color:#888;font-size:13px;padding:4px 0;">Dagsetning</td>
                    <td align="right" style="color:#fff;font-size:13px;">${event.date}</td>
                  </tr>
                  <tr>
                    <td style="color:#888;font-size:13px;padding:4px 0;">Tími</td>
                    <td align="right" style="color:#fff;font-size:13px;">${event.time}</td>
                  </tr>
                  <tr>
                    <td style="color:#888;font-size:13px;padding:4px 0;">Staður</td>
                    <td align="right" style="color:#fff;font-size:13px;">${event.venue || "Dillon"}</td>
                  </tr>
                  <tr>
                    <td style="color:#888;font-size:13px;padding:4px 0;">Fjöldi miða</td>
                    <td align="right" style="color:#fff;font-size:13px;font-weight:600;">${ticketCount}</td>
                  </tr>
                </table>
              </div>

              <!-- Line items -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #222;">
                <tr>
                  <td style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:12px 0 8px;">Vara</td>
                  <td align="right" style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:12px 0 8px;">Verð</td>
                </tr>
                <tr>
                  <td style="color:#fff;font-size:14px;padding:8px 0;">🎫 ${event.title} × ${ticketCount}</td>
                  <td align="right" style="color:#fff;font-size:14px;padding:8px 0;">${formatISK(totalAmount)}</td>
                </tr>

                <!-- Total -->
                <tr>
                  <td colspan="2" style="border-top:1px solid #333;padding-top:12px;"></td>
                </tr>
                <tr>
                  <td style="color:#d4af37;font-size:16px;font-weight:800;padding:4px 0;">Samtals</td>
                  <td align="right" style="color:#d4af37;font-size:20px;font-weight:900;">${formatISK(totalAmount)}</td>
                </tr>
              </table>

              <!-- Footer note -->
              <div style="margin-top:32px;padding-top:24px;border-top:1px solid #1a1a1a;text-align:center;">
                <p style="color:#555;font-size:12px;margin:0;">Spurningar? Sendu okkur póst á <a href="mailto:dillon@dillon.is" style="color:#d4af37;">dillon@dillon.is</a></p>
                <p style="color:#333;font-size:11px;margin:8px 0 0;">Dillon · Laugavegur 1, 101 Reykjavík</p>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
    try {
        const { id } = await request.json();
        if (!id)
            return NextResponse.json({ error: "Missing order id" }, { status: 400 });

        // Get the order
        const orderSnap = await getDoc(doc(db, "ticketOrders", id));
        if (!orderSnap.exists())
            return NextResponse.json({ error: "Order not found" }, { status: 404 });

        const order = { id: orderSnap.id, ...orderSnap.data() };
        const { userEmail, userName, eventId } = order as any;

        // Get the event
        const eventSnap = await getDoc(doc(db, "events", eventId));
        if (!eventSnap.exists())
            return NextResponse.json({ error: "Event not found" }, { status: 404 });

        const event = { id: eventSnap.id, ...eventSnap.data() };

        const html = buildReceiptHTML(order, event);

        await transporter.sendMail({
            from: FROM_EMAIL,
            to: userEmail,
            bcc: BCC_EMAIL,
            subject: `🎫 Miðapöntun Staðfest — ${(event as any).title}`,
            html,
            text: `Hæ ${userName}! Pöntun þín á miðum á ${(event as any).title} er staðfest. Sjá HTML útgáfu fyrir sundurliðaðan reikning.`,
        });

        console.log(`Receipt sent to ${userEmail} for order ${id}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("send-receipt error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
