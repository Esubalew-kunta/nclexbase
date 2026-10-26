import type { CollectionName } from "./types";

/** Where a record of each collection is edited in the admin (used by Audit Log and Dashboard links). */
export function adminHref(entity: string, id?: string): string | null {
  const e = encodeURIComponent(id ?? "");
  const map: Partial<Record<CollectionName | "settings", string>> = {
    subjects: id ? `/admin/subjects?open=${e}` : "/admin/subjects",
    memoryTricks: id ? `/admin/memory-tricks?edit=${e}` : "/admin/memory-tricks",
    cheatSheets: id ? `/admin/cheat-sheets?edit=${e}` : "/admin/cheat-sheets",
    questions: id ? `/admin/questions/edit?id=${e}` : "/admin/questions",
    cases: id ? `/admin/cases/edit?id=${e}` : "/admin/cases",
    readiness: "/admin/readiness",
    courses: "/admin/courses",
    lessons: "/admin/courses",
    faqs: id ? `/admin/faqs?edit=${e}` : "/admin/faqs",
    plans: "/admin/plans",
    users: id ? `/admin/users?edit=${e}` : "/admin/users",
    promoCodes: id ? `/admin/promo-codes?edit=${e}` : "/admin/promo-codes",
    redemptions: "/admin/promo-codes",
    referrals: "/admin/referrals",
    referralCodes: "/admin/referrals",
    payments: id ? `/admin/payments?edit=${e}` : "/admin/payments",
    paymentMethods: "/admin/payments?tab=methods",
    notifications: "/admin/payments?tab=notifications",
    messages: id ? `/admin/inbox?edit=${e}` : "/admin/inbox",
    announcements: id ? `/admin/announcements?edit=${e}` : "/admin/announcements",
    settings: "/admin/settings",
  };
  return map[entity as CollectionName] ?? null;
}
