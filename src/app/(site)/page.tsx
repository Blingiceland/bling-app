import ActionLinks from "@/components/site/ActionLinks";
import InfoSections from "@/components/site/InfoSections";

export const metadata = {
  title: "Dillon | Whiskey Bar & Live Music",
  description: "Live music, DJs & whiskey in the heart of Reykjavík. Laugavegur 30, 101 Reykjavík.",
};

export default function HomePage() {
  return (
    <>
      <ActionLinks />
      <InfoSections />
    </>
  );
}
