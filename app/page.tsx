import { redirect } from "next/navigation"
import { isInstalledServer } from "@/lib/installation"
import HomeRedirector from "./home-redirector"

/**
 * This is the main entry point (/) of the application.
 * It is a Server Component responsible for checking the installation status
 * and redirecting the user accordingly.
 */
export default async function RootPage() {
  const installed = await isInstalledServer()

  if (!installed) {
    // If not installed, redirect to the installation wizard
    redirect("/install")
  }

  // If installed, render the client component that handles user authentication and routing
  return <HomeRedirector />
}
