import type { Metadata } from "next";
import { getAdminSeasons } from "./data";
import SeasonAccordion from "./_components/SeasonAccordion";

export const metadata: Metadata = {
  title: "Seasons — Admin FORMAT",
};

export default async function AdminHomePage() {
  const seasons = await getAdminSeasons();
  return <SeasonAccordion seasons={seasons} />;
}
