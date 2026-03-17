import ActionLinks from "@/components/site/ActionLinks";
import InfoSections from "@/components/site/InfoSections";
import WeeklySchedule from "@/components/site/WeeklySchedule";
import { fetchScheduleEvents } from "@/lib/schedule";

export const metadata = {
  title: "Dillon | Whiskey Bar & Live Music",
  description: "Live music, DJs & whiskey in the heart of Reykjavík. Laugavegur 30, 101 Reykjavík.",
};

export default async function HomePage() {
  const events = await fetchScheduleEvents();

  return (
    <>
      <ActionLinks />
      <WeeklySchedule events={events} />
      <InfoSections />
    </>
  );
}

