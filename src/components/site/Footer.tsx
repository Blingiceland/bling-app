export default function Footer() {
  return (
    <footer className="site-footer">
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ color: "#fff", fontSize: "32px", marginBottom: "20px" }}>DILLON</h2>
        <p style={{ fontSize: "18px", color: "#ccc", marginBottom: "10px" }}>Laugavegur 30, 101 Reykjavík</p>
        <p>Live music, DJs &amp; whiskey in the heart of Reykjavík</p>
      </div>

      <div style={{ marginBottom: "40px", display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap" as const }}>
        <div>
          <h4 style={{ color: "var(--color-gold)", marginBottom: "10px" }}>Opening Hours</h4>
          <p>Sun–Thu: 12:00 – 01:00</p>
          <p>Fri–Sat: 12:00 – 03:00</p>
        </div>
        <div>
          <h4 style={{ color: "var(--color-gold)", marginBottom: "10px" }}>Happy Hour</h4>
          <p>Every Day: 12:00 – 19:00</p>
        </div>
        <div>
          <h4 style={{ color: "var(--color-gold)", marginBottom: "10px" }}>Contact</h4>
          <p><a href="mailto:dillon@dillon.is">dillon@dillon.is</a></p>
          <p style={{ marginTop: "10px" }}><a href="tel:+3548981290">+354 898-1290</a></p>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto 40px auto", border: "1px solid #333" }}>
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1739.8166675037146!2d-21.932822723659223!3d64.14382581699925!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48d674ccca94751f%3A0xe5a3c9b736b4de3e!2sDillon%20Whiskey%20Bar!5e0!3m2!1sen!2sis!4v1700000000000!5m2!1sen!2sis" 
          width="100%" 
          height="250" 
          style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(85%) contrast(85%) sepia(20%)" }} 
          allowFullScreen={false} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Dillon Location Map"
        ></iframe>
      </div>

      <div style={{ fontSize: "14px", borderTop: "1px solid #222", paddingTop: "20px" }}>
        &copy; {new Date().getFullYear()} Dillon Whiskey Bar. All rights reserved.
      </div>
    </footer>
  );
}
