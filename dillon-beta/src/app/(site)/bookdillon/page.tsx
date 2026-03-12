export const metadata = {
  title: "Book Dillon | Private Events & Live Music",
  description: "Book Dillon for private events or live music shows. Contact us at dillon@dillon.is",
};

export default function BookDillonPage() {
  return (
    <div style={{
      paddingTop: "150px",
      minHeight: "100vh",
      paddingBottom: "100px",
      backgroundColor: "#000",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        maxWidth: "800px",
        width: "90%",
        margin: "0 auto",
        textAlign: "center",
        border: "1px solid var(--color-gold)",
        padding: "60px",
        background: "rgba(20, 20, 20, 0.8)",
      }}>
        <h1 className="text-gold" style={{
          fontSize: "3.5rem",
          marginBottom: "40px",
          fontFamily: "var(--font-heading)",
          textTransform: "uppercase",
        }}>Book Dillon</h1>

        <p style={{
          fontSize: "1.5rem",
          lineHeight: "1.8",
          fontFamily: "var(--font-body)",
          color: "#ccc",
        }}>
          If you want to book Dillon for a private event or for a live music event send us on email to{" "}
          <a href="mailto:dillon@dillon.is" className="text-gold" style={{ textDecoration: "underline" }}>
            dillon@dillon.is
          </a>
        </p>
      </div>
    </div>
  );
}
