import type { ReactNode } from "react"
import StudentLayoutWrapper from "./layout-wrapper"

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <StudentLayoutWrapper>{children}</StudentLayoutWrapper>
}
