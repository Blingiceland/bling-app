import { NextResponse } from "next/server";
import { transporter, FROM_EMAIL, BCC_EMAIL } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { date, name, bandName, email, phone, details } = await req.json();

    if (!date || !name || !email || !details) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const mailOptions = {
      from: FROM_EMAIL,
      to: BCC_EMAIL,
      replyTo: email,
      subject: `Booking Request: ${bandName || name} on ${date}`,
      html: `
        <h2>New Booking Inquiry</h2>
        <p><strong>Date Requested:</strong> ${date}</p>
        <p><strong>Contact Name:</strong> ${name}</p>
        <p><strong>Band/Event Name:</strong> ${bandName || "N/A"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <hr />
        <h3>Details</h3>
        <p>${details.replace(/\n/g, "<br/>")}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send booking inquiry:", error);
    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }
}
