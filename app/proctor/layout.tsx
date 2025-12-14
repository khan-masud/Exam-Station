import type { ReactNode } from "react"
import ProctorLayoutWrapper from "./layout-wrapper"

export default function ProctorLayout({ children }: { children: ReactNode }) {
  return <ProctorLayoutWrapper>{children}</ProctorLayoutWrapper>
}
