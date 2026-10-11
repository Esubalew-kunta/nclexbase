"use client";

import clsx from "clsx";
import Link from "next/link";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { signInAdmin, signInStudent } from "@/lib/demo";

/**
 * PROTOTYPE control: jump between the student app and the admin, shown in both top bars.
 * Clicking a side signs into it with the demo account first, so nobody types credentials.
 * Remove when real authentication and roles exist (backend).
 */
export function ViewSwitch({ current }: { current: "student" | "admin" }) {
  const item = (side: "student" | "admin", href: string, label: string, Icon: typeof ShieldCheck) => {
    const on = current === side;
    return (
      <Link
        href={href}
        aria-current={on ? "page" : undefined}
        onClick={() => (side === "admin" ? signInAdmin() : signInStudent())}
        title={on ? `You are on the ${label.toLowerCase()} side` : `Switch to the ${label.toLowerCase()} side`}
        className={clsx(
          "flex h-full items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors",
          on ? "bg-primary text-white" : "text-primary hover:bg-primary-light",
        )}
      >
        <Icon className="size-4" />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  };
  return (
    <nav aria-label="Switch between student and admin" className="flex h-[38px] shrink-0 items-center rounded-full border border-line bg-white p-0.5">
      {item("student", "/nclex", "Student", GraduationCap)}
      {item("admin", "/admin", "Admin", ShieldCheck)}
    </nav>
  );
}
