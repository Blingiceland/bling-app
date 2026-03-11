"use client";

import { useEffect } from "react";

export default function StefnaPage() {
  useEffect(() => {
    window.location.href = "https://dillonstefna.vercel.app/";
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <p>Hleð inn...</p>
    </div>
  );
}
