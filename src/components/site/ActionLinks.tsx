export default function ActionLinks() {
  return (
    <div style={{
      padding: "80px 20px",
      textAlign: "center" as const,
      background: "var(--color-bg)",
      position: "relative" as const,
    }}>
      {/* Opening Hours Section */}
      <div style={{ marginBottom: "50px" }}>
        <h2 style={{ fontSize: "36px", color: "var(--color-gold)", marginBottom: "10px" }}>
          OPEN DAILY
        </h2>
        <p style={{ fontSize: "20px", fontFamily: "var(--font-heading)", letterSpacing: "1px" }}>
          Sun–Thu 12:00–01:00 <span className="text-gold">•</span> Fri–Sat 12:00–03:00
        </p>

        <div style={{ margin: "30px 0" }}>
          <h3 style={{ fontSize: "28px", color: "#fff" }}>HAPPY HOUR</h3>
          <p style={{ fontSize: "20px", color: "var(--color-gold)" }}>12–19 Every day</p>
        </div>
      </div>

      <p style={{
        fontSize: "20px",
        maxWidth: "600px",
        margin: "0 auto 40px",
        lineHeight: "1.5",
        color: "#ccc",
      }}>
        Upcoming gigs, DJs and special nights. Full schedule on Instagram.
      </p>

      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        flexWrap: "wrap" as const,
      }}>
        <a href="/whatson" className="btn btn-primary">
          What&apos;s On
        </a>

        <a href="https://bce3rd-eu.myshopify.com/" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          Merch
        </a>

        <a href="https://tix.is" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          Whiskey School
        </a>
      </div>
    </div>
  );
}
