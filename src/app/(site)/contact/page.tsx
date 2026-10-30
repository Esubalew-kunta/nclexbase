"use client";

import { ContactForm } from "@/components/site/ContactForm";
import { PageHeader, Prose, Section } from "@/components/site/Prose";
import { useConfig } from "@/lib/content";

/*
 * Contact.
 *
 * A form and an address. The form hands the finished message to the visitor's own mail app
 * (see ContactForm) because the API has no contact endpoint yet, and a form that posts into
 * nothing is worse than no form at all. The address stays printed underneath for anyone whose
 * device has no mail app set up, and it is the one the admin has configured.
 */
export default function ContactPage() {
  const { branding, payments } = useConfig();
  const email = branding.supportEmail;

  return (
    <main>
      <PageHeader eyebrow="Contact" title="Talk to us." intro="Questions about a plan, a payment, or an explanation you think is wrong." />

      <Prose>
        <Section title="Send a message">
          {email ? (
            <>
              <p>Include your account email if your question is about a payment or your access.</p>
              <div className="mt-5 not-prose">
                <ContactForm email={email} />
              </div>
            </>
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
            Send the question&apos;s id, which is shown with every item, and say what you think the answer should be. Being told an
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
