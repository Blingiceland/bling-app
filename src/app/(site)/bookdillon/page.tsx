import { fetchScheduleEvents } from "@/lib/schedule";
import BookingForm from "@/components/site/BookingForm";

export const metadata = {
  title: "Book Dillon | Private Events & Live Music",
  description: "Book Dillon for private events or live music shows. Contact us at dillon@dillon.is",
};

export default async function BookDillonPage() {
  const events = await fetchScheduleEvents();
  
  // Extract dates that are already booked (YYYY-MM-DD)
  const bookedDates = events.map(e => {
    const d = e.dateObj;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Remove duplicates just in case
  const uniqueBookedDates = [...new Set(bookedDates)];

  return (
    <div style={{
      paddingTop: "120px",
      minHeight: "100vh",
      paddingBottom: "100px",
      backgroundColor: "#000",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
    }}>
      <div style={{
        maxWidth: "900px",
        width: "90%",
        margin: "0 auto",
        textAlign: "center",
        marginBottom: "40px"
      }}>
        <h1 className="text-gold" style={{
          fontSize: "3.5rem",
          marginBottom: "20px",
          fontFamily: "var(--font-heading)",
          textTransform: "uppercase",
        }}>Book Dillon</h1>
      </div>

      <div style={{ width: "90%", maxWidth: "800px" }}>
        <BookingForm bookedDates={uniqueBookedDates} />
      </div>
    </div>
  );
}
