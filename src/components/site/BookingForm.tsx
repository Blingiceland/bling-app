"use client";

import { useState } from "react";

interface Props {
  bookedDates: string[]; // Standardized to "YYYY-MM-DD"
}

export default function BookingForm({ bookedDates }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [bandName, setBandName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Calendar logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    // Convert Sunday = 0 to Monday = 0, Sunday = 6
    return day === 0 ? 6 : day - 1;
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null); // Empty slots for days before the 1st
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const isBooked = (date: Date) => {
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return bookedDates.includes(dStr);
  };

  const isPast = (date: Date) => {
    return date < today;
  };

  const isSelected = (date: Date) => {
    return selectedDate && selectedDate.getTime() === date.getTime();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      setErrorMessage("Vinsamlegast veldu dagsetningu (Please select a date).");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const dStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
      
      const res = await fetch("/api/send-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dStr,
          name,
          bandName,
          email,
          phone,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Failed to send the request. Please try again or email us directly at dillon@dillon.is.");
    }
  };

  if (status === "success") {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", border: "1px solid var(--color-gold)", background: "rgba(20,20,20,0.8)" }}>
        <h2 style={{ color: "var(--color-gold)", fontFamily: "var(--font-heading)", fontSize: "2.5rem", marginBottom: "20px" }}>
          TAKK FYRIR!
        </h2>
        <p style={{ color: "#ccc", fontFamily: "var(--font-body)", fontSize: "1.1rem" }}>
          Fyrirspurnin hefur verið send. Við munum hafa samband eins fljótt og auðið er!
        </p>
        <p style={{ color: "#aaa", fontFamily: "var(--font-body)", fontSize: "1rem", marginTop: "10px" }}>
          Thank you! Your request has been sent. We will get back to you shortly.
        </p>
      </div>
    );
  }

  const MONTH_NAMES = ["Janúar", "Febrúar", "Mars", "Apríl", "Maí", "Júní", "Júlí", "Ágúst", "September", "Október", "Nóvember", "Desember"];
  const DAY_NAMES = ["Mán", "Þri", "Mið", "Fim", "Fös", "Lau", "Sun"];

  return (
    <div style={{
      border: "1px solid #333",
      padding: "30px",
      background: "rgba(10, 10, 10, 0.8)",
      textAlign: "left"
    }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        
        {/* Step 1: Calendar */}
        <div>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "var(--color-gold)", marginBottom: "5px" }}>
            1. Veldu Dagsetningu (Select a Date)
          </h3>
          <p style={{ fontFamily: "var(--font-body)", color: "#888", fontSize: "0.9rem", marginBottom: "20px" }}>
            Dagar með viðburðum (gráir) eru ekki í boði.
          </p>

          <div style={{ border: "1px solid #222", padding: "20px", background: "#050505" }}>
            {/* Calendar Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <button 
                type="button" 
                onClick={prevMonth}
                style={{ background: "none", border: "1px solid var(--color-gold)", color: "var(--color-gold)", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >←</button>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", color: "#fff", textTransform: "uppercase" }}>
                {MONTH_NAMES[month]} {year}
              </div>
              <button 
                type="button" 
                onClick={nextMonth}
                style={{ background: "none", border: "1px solid var(--color-gold)", color: "var(--color-gold)", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >→</button>
            </div>

            {/* Days of week */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px", marginBottom: "5px", textAlign: "center", fontFamily: "var(--font-heading)", color: "var(--color-gold)" }}>
              {DAY_NAMES.map(d => <div key={d}>{d}</div>)}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
              {days.map((d, i) => {
                if (!d) return <div key={i} />; // Empty box
                
                const past = isPast(d);
                const booked = isBooked(d);
                const disabled = past || booked;
                const selected = isSelected(d);

                let bg = "transparent";
                let color = "#fff";
                let border = "1px solid #222";
                let cursor = "pointer";

                if (disabled) {
                  bg = "rgba(40,40,40,0.5)";
                  color = "#555";
                  cursor = "not-allowed";
                  border = "1px solid #222";
                } else if (selected) {
                  bg = "var(--color-gold)";
                  color = "#000";
                  border = "1px solid var(--color-gold)";
                }

                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (!disabled) {
                        setSelectedDate(d);
                      }
                    }}
                    style={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-body)",
                      fontSize: "1rem",
                      background: bg,
                      color: color,
                      border: border,
                      cursor: cursor,
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      if (!disabled && !selected) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-gold)";
                    }}
                    onMouseLeave={(e) => {
                      if (!disabled && !selected) (e.currentTarget as HTMLDivElement).style.borderColor = "#222";
                    }}
                    title={booked ? "Dagur tekinn" : past ? "Liðinn dagur" : "Laus dagur"}
                  >
                    {d.getDate()}
                  </div>
                )
              })}
            </div>
            {selectedDate && (
              <div style={{ marginTop: "15px", color: "var(--color-gold)", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
                Valinn dagur: <strong>{selectedDate.toLocaleDateString("is-IS")}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Form Fields */}
        <div>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "var(--color-gold)", marginBottom: "20px" }}>
            2. Upplýsingar (Your Details)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontFamily: "var(--font-body)", color: "#ccc", fontSize: "0.9rem" }}>Hver ert þú? (Contact Name) *</label>
              <input 
                required 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                style={{ padding: "12px", background: "#000", border: "1px solid #333", color: "#fff", outline: "none", fontFamily: "var(--font-body)" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontFamily: "var(--font-body)", color: "#ccc", fontSize: "0.9rem" }}>Hvað heitir bandið/viðburðurinn?</label>
              <input 
                type="text" 
                value={bandName} 
                onChange={(e) => setBandName(e.target.value)}
                style={{ padding: "12px", background: "#000", border: "1px solid #333", color: "#fff", outline: "none", fontFamily: "var(--font-body)" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontFamily: "var(--font-body)", color: "#ccc", fontSize: "0.9rem" }}>Netfang (Email) *</label>
              <input 
                required 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: "12px", background: "#000", border: "1px solid #333", color: "#fff", outline: "none", fontFamily: "var(--font-body)" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontFamily: "var(--font-body)", color: "#ccc", fontSize: "0.9rem" }}>Símanúmer (Phone Number)</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                style={{ padding: "12px", background: "#000", border: "1px solid #333", color: "#fff", outline: "none", fontFamily: "var(--font-body)" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontFamily: "var(--font-body)", color: "#ccc", fontSize: "0.9rem" }}>Hvað ertu að spá? (Proposed idea & details) *</label>
            <textarea 
              required 
              rows={4}
              value={details} 
              onChange={(e) => setDetails(e.target.value)}
              style={{ padding: "12px", background: "#000", border: "1px solid #333", color: "#fff", outline: "none", fontFamily: "var(--font-body)", resize: "vertical" }}
            />
          </div>
        </div>

        {errorMessage && (
          <div style={{ color: "#ff4d4d", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
            {errorMessage}
          </div>
        )}

        <button 
          type="submit" 
          disabled={status === "loading" || !selectedDate}
          style={{ 
            padding: "16px", 
            background: (status === "loading" || !selectedDate) ? "#333" : "var(--color-gold)", 
            color: (status === "loading" || !selectedDate) ? "#888" : "#000", 
            fontFamily: "var(--font-heading)", 
            fontSize: "1.2rem", 
            border: "none", 
            cursor: (status === "loading" || !selectedDate) ? "not-allowed" : "pointer",
            width: "100%",
            transition: "all 0.2s",
            letterSpacing: "1px",
            marginTop: "10px"
          }}
        >
          {status === "loading" ? "SENDI..." : "SENDA FYRIRSPURN (SEND INQUIRY)"}
        </button>
      </form>
    </div>
  );
}
