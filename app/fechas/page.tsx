import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import DatesView from "@/components/agenda/DatesView";
import { getFechasProximas, getFechasPasadas } from "@/lib/data/fechas";
import { getSeasons, getActiveSeason } from "@/lib/data/seasons";

export const metadata: Metadata = {
  title: "Próximas Fechas — FORMAT",
  description: "Las próximas fechas de FORMAT, todos los viernes en la terraza de JET.",
};
export const revalidate = 300;

export default async function FechasPage() {
  const [proximas, pasadas, seasons, activeSeason] = await Promise.all([
    getFechasProximas(), getFechasPasadas(), getSeasons(), getActiveSeason(),
  ]);
  return <><Nav /><DatesView proximas={proximas} pasadas={pasadas} seasons={seasons} activeSeason={activeSeason} /><Footer /></>;
}
