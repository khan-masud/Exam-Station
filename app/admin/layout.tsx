import type { ReactNode } from "react"
import AdminLayoutWrapper from "./layout-wrapper"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
}
