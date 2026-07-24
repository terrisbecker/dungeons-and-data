import { redirect } from "next/navigation";
import { getToken } from "@/lib/session";

// Entry point: send visitors to the dashboard or the login page based on whether
// they have a session cookie.
export default async function Home() {
  const token = await getToken();
  redirect(token ? "/dashboard" : "/login");
}
