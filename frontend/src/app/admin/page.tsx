import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata = {
  title: "Admin Dashboard — Zenvyra",
  description: "Monitor total users, AI tool usage, and errors on Zenvyra.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
