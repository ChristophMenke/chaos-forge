import { redirect } from "next/navigation";

// /master/npcs has no standalone page — redirect to the GM dashboard NPC tab
export default function NpcsIndexPage() {
  redirect("/master");
}
