"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { AccountShell, Field, PanelCard } from "@/components/home/AccountShell";

export default function ProfilePage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const [name, setName] = useState(user.name);
  return (
    <AccountShell active="profile">
      <PanelCard title="Personal Details">
        <div className="mr-3 mb-4 flex cursor-pointer items-center rounded-lg transition-colors duration-100">
          <span className="flex h-[50px] w-9 items-center justify-center rounded-full p-0.5">
            <span className="flex size-8 items-center justify-center rounded-[32px] bg-[#e0e6eb] text-xs leading-none font-medium text-[#2d3a46] uppercase">
              {(user.name || user.email).charAt(0)}
            </span>
          </span>
          <span className="ml-2 text-lg leading-[18px] font-semibold text-brand hover:underline">Upload a profile picture</span>
        </div>
        <Field
          label="Name"
          placeholder="What should we call you?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => useStore.setState((s) => ({ user: { ...s.user, name } }))}
        />
        <Field label="Contact Email" right="Verified" type="email" defaultValue={user.email} />
        <Field label="Username" readOnly value={user.email} />
        <button className="flex cursor-pointer items-center rounded-lg pt-4 pb-2 text-lg font-semibold text-[#6366f1] transition-colors duration-100 hover:text-[#818cf8]">
          Change Password
        </button>
      </PanelCard>
      <div className="mx-auto mt-8 w-60">
        <button
          onClick={() => router.push("/auth/signin")}
          className="flex h-14 w-full cursor-pointer items-center justify-center rounded-lg border border-white px-4 py-[19px] text-lg leading-[18px] text-white shadow-[0_2px_0_0_#ededf0] transition-colors hover:bg-white/10 active:translate-y-[2px] active:shadow-none"
        >
          Log Out
        </button>
      </div>
    </AccountShell>
  );
}
