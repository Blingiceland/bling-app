import { fetchDrinksList } from "@/lib/whisky";
import FadeIn from "@/components/ui/FadeIn";

export const metadata = {
  title: "Dillon | Drinks Menu",
  description: "Dillon Whiskey Bar's selection of gin, vodka, tequila, rum, wines and more.",
};

export const revalidate = 3600;

export default async function DrinksMenuPage() {
  const drinks = await fetchDrinksList();

  // Group by category, preserving the order they appeared in the CSV
  const grouped: Record<string, typeof drinks> = {};
  const categoryOrder: string[] = [];

  drinks.forEach((d) => {
    if (!grouped[d.category]) {
      grouped[d.category] = [];
      categoryOrder.push(d.category);
    }
    grouped[d.category].push(d);
  });

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#0a0a0a",
        minHeight: "100vh",
        padding: "100px 20px 100px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "3.5rem",
                color: "var(--color-gold)",
                letterSpacing: "4px",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              DRINKS MENU
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1.2rem",
                color: "#888",
                marginTop: "12px",
                letterSpacing: "1px",
              }}
            >
              Our selection of gin, tequila, rum, wine, and more.
            </p>
            <div
              style={{
                width: "80px",
                height: "2px",
                background: "var(--color-gold)",
                margin: "30px auto 0",
              }}
            />
          </div>
        </FadeIn>

        {/* Categories Loop */}
        {categoryOrder.map((cat, idx) => {
          const catDrinks = grouped[cat];
          return (
            <FadeIn key={cat} delay={100 * idx}>
              <div style={{ marginBottom: "50px" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "2rem",
                    color: "#fff",
                    letterSpacing: "2px",
                    borderBottom: "1px solid #333",
                    paddingBottom: "10px",
                    marginBottom: "20px",
                    textTransform: "uppercase",
                  }}
                >
                  {cat}
                </h2>

                <div 
                  style={{
                    display: "flex",
                    padding: "8px 16px",
                    color: "var(--color-gold)",
                    fontFamily: "var(--font-heading)",
                    letterSpacing: "1px",
                    borderBottom: "1px solid rgba(230, 185, 128, 0.2)",
                    marginBottom: "10px"
                  }}
                >
                  <span style={{ flex: 1 }}>NAME</span>
                  <span style={{ width: "100px", textAlign: "right" }}>PRICE</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {catDrinks.map((d, dIdx) => (
                    <div
                      key={dIdx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 16px",
                        backgroundColor: dIdx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          fontFamily: "var(--font-subheading)",
                          fontSize: "1.1rem",
                          color: "#ddd",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {d.name}
                      </span>
                      <span
                        style={{
                          width: "100px",
                          fontFamily: "var(--font-body)",
                          fontSize: "1rem",
                          color: "var(--color-gold)",
                          fontWeight: 600,
                          textAlign: "right",
                        }}
                      >
                        {d.price ? `${d.price} kr` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          );
        })}

        {/* Footer */}
        <FadeIn delay={200}>
          <div
            style={{
              textAlign: "center",
              marginTop: "40px",
              color: "#555",
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              paddingTop: "40px",
              borderTop: "1px solid #222"
            }}
          >
            <p>Selection and prices may vary. Please ask your bartender for daily specials.</p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
