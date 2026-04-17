import { fetchWhiskyList } from "@/lib/whisky";

export const metadata = {
  title: "Dillon | Whisky List",
  description:
    "Our current whisky selection – over 170 whiskies from around the world. Dillon Whiskey Bar, Laugavegur 30, Reykjavík.",
};

export const revalidate = 3600;

export default async function WhiskyListPage() {
  const whiskies = await fetchWhiskyList();

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#0a0a0a",
        minHeight: "100vh",
        padding: "60px 20px 100px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "3rem",
              color: "var(--color-gold)",
              letterSpacing: "4px",
              margin: 0,
            }}
          >
            OUR WHISKY COLLECTION
          </h1>
          <p
            style={{
              fontFamily: "var(--font-subheading)",
              fontSize: "1.1rem",
              color: "#888",
              marginTop: "12px",
              letterSpacing: "1px",
            }}
          >
            {whiskies.length} whiskies from around the world
          </p>
          <div
            style={{
              width: "60px",
              height: "2px",
              background: "var(--color-gold)",
              margin: "20px auto 0",
            }}
          />
        </div>

        {/* Table header */}
        <div
          style={{
            display: "flex",
            padding: "12px 16px",
            borderBottom: "2px solid var(--color-gold)",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              flex: 1,
              fontFamily: "var(--font-heading)",
              fontSize: "1.1rem",
              color: "var(--color-gold)",
              letterSpacing: "2px",
            }}
          >
            NAME
          </span>
          <span
            style={{
              width: "200px",
              fontFamily: "var(--font-heading)",
              fontSize: "1.1rem",
              color: "var(--color-gold)",
              letterSpacing: "2px",
              textAlign: "center",
            }}
          >
            CATEGORY
          </span>
          <span
            style={{
              width: "100px",
              fontFamily: "var(--font-heading)",
              fontSize: "1.1rem",
              color: "var(--color-gold)",
              letterSpacing: "2px",
              textAlign: "right",
            }}
          >
            PRICE
          </span>
        </div>

        {/* Rows */}
        {whiskies.map((w, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              backgroundColor:
                i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
            }}
          >
            <span
              style={{
                flex: 1,
                fontFamily: "var(--font-subheading)",
                fontSize: "1rem",
                color: "#ddd",
                letterSpacing: "0.5px",
              }}
            >
              {w.name}
            </span>
            <span
              style={{
                width: "200px",
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                color: "#888",
                textAlign: "center",
              }}
            >
              {w.category}
            </span>
            <span
              style={{
                width: "100px",
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                color: "var(--color-gold)",
                fontWeight: 600,
                textAlign: "right",
              }}
            >
              {w.price ? `${w.price} kr` : "—"}
            </span>
          </div>
        ))}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "60px",
            color: "#555",
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
          }}
        >
          <p>Prices are in ISK per glass. Selection may vary.</p>
        </div>
      </div>
    </div>
  );
}
