import { StudentGuard } from "@/components/shell/StudentGuard";

/** Full-screen exam routes share the student sign-in gate. */
export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return <StudentGuard>{children}</StudentGuard>;
}
