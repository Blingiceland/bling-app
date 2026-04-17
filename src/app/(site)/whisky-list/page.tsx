import { fetchWhiskyList } from "@/lib/whisky";
import WhiskyClientList from "@/components/site/WhiskyClientList";

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
        <WhiskyClientList whiskies={whiskies} />
      </div>
    </div>
  );
}
