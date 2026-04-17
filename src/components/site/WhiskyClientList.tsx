"use client";

import { useState, useMemo } from "react";
import type { WhiskyItem } from "@/lib/whisky";

interface Props {
  whiskies: WhiskyItem[];
}

export default function WhiskyClientList({ whiskies }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Extract unique categories, sorted alphabetically
  const categories = useMemo(() => {
    const cats = whiskies
      .map((w) => w.category)
      .filter((c) => c && c.trim() !== "");
    const unique = Array.from(new Set(cats)).sort();
    return ["All", ...unique];
  }, [whiskies]);

  // Filter whiskies based on selected category
  const filteredWhiskies = useMemo(() => {
    if (selectedCategory === "All") return whiskies;
    return whiskies.filter((w) => w.category === selectedCategory);
  }, [whiskies, selectedCategory]);

  return (
    <>
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

      {/* Category Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          justifyContent: "center",
          marginBottom: "40px",
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: isSelected ? "var(--color-gold)" : "transparent",
                color: isSelected ? "#0a0a0a" : "var(--color-gold)",
                border: "1px solid var(--color-gold)",
                padding: "8px 16px",
                fontFamily: "var(--font-heading)",
                fontSize: "0.9rem",
                letterSpacing: "1px",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                borderRadius: "3px",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "rgba(230, 185, 128, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {cat}
            </button>
          );
        })}
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
          className="whisky-category-col"
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
      {filteredWhiskies.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#888", fontFamily: "var(--font-body)" }}>
          Engin whiský fundust í þessum flokki.
        </div>
      ) : (
        filteredWhiskies.map((w, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
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
              className="whisky-category-col"
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
        ))
      )}

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
      
      {/* Add mobile CSS via inline style to hide category column on very small screens to make space for the name and price */}
      <style dangerouslySetInnerHTML={{__html:`
        @media (max-width: 600px) {
          .whisky-category-col {
            display: none !important;
          }
        }
      `}} />
    </>
  );
}
