"use client";

import { PageHeader, Prose, Section } from "@/components/site/Prose";
import { useConfig } from "@/lib/content";

/*
 * Contact.
 *
 * An address, not a form. A contact form needs somewhere to post to, and the only honest
 * version of that is an endpoint that actually delivers mail — the API's mail carrier is still
 * deliberately `log` (see docs/BACKEND_PLAN.md). A form that silently drops messages is worse
 * than no form, so this page gives the address the admin has set and nothing it cannot keep.
 */
export default function ContactPage() {
  const { branding, payments } = useConfig();
  const email = branding.supportEmail;

  return (
    <main>
      <PageHeader eyebrow="Contact" title="Talk to us." intro="Questions about a plan, a payment, or an explanation you think is wrong." />

      <Prose>
        <Section title="Email">
          {email ? (
            <p>
              Write to{" "}
              <a href={`mailto:${email}`} className="font-semibold text-primary hover:text-primary-hover">
                {email}
              </a>
              . Include your account email if your question is about a payment or your access.
            </p>
          ) : (
            <p>The support address is being set up. Until then, use the contact details shown at checkout.</p>
          )}
        </Section>

        <Section title="Payments and access">
          <p>
            If you have paid and your access has not opened yet, send the reference from your payment page. Reviews usually happen{" "}
            {payments.reviewTime || "within a day"}.
          </p>
        </Section>

        <Section title="A question that looks wrong">
          <p>
            Send the question&apos;s id — it is shown with every item — and say what you think the answer should be. Being told an
            explanation is wrong is more useful to us than almost anything else, and it gets to whoever wrote it.
          </p>
        </Section>

        <Section title="Schools and institutions">
          <p>Email the address above with how many students you are asking for and when they sit the exam.</p>
        </Section>
      </Prose>
    </main>
  );
}
