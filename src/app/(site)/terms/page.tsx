"use client";

import Link from "next/link";
import { PageHeader, Prose, Section, Updated } from "@/components/site/Prose";
import { SITE_NAME } from "@/lib/brand";
import { useConfig } from "@/lib/content";

/*
 * Terms of use.
 *
 * Specific to how this product is sold: access is a time window you buy, payment is a bank
 * transfer or wallet confirmed by hand, and the content is ours to lend rather than yours to
 * redistribute. Those three facts are what a template would get wrong.
 *
 * It promises no exam result, because no prep site can. Not reviewed by a lawyer — said on the
 * page, and on PROGRESS.md as an open item before the site goes public.
 */

/** Change this when the terms change. */
const UPDATED = "29 October 2026";

export default function TermsPage() {
  const { branding, payments } = useConfig();
  const name = branding.siteName || SITE_NAME;

  return (
    <main>
      <PageHeader eyebrow="Legal" title="Terms of use" intro={`The agreement between you and ${name} when you use this site.`} />

      <Prose>
        <Updated date={UPDATED} />

        <Section id="agreement" title="Using this site">
          <p>
            By creating an account or using {name} you accept these terms. If you do not accept them, do not use the site. Where you use the
            site on behalf of a school or employer, you confirm you may accept these terms for them.
          </p>
        </Section>

        <Section id="account" title="Your account">
          <p>
            One account is for one person. Keep your password to yourself: anything done with your account is treated as done by you, and
            sharing an account is grounds for closing it without a refund.
          </p>
          <p>Give an email address you can actually receive, because password resets and payment confirmations go to it.</p>
        </Section>

        <Section id="access" title="What you are buying">
          <p>
            A plan buys access for a period of time, not a copy of anything. When the period ends, access ends. We may add to, change or
            retire material during your period — the library is maintained, not frozen — and we will not remove so much that the plan stops
            being what you paid for.
          </p>
          <p>Some material is free to any account. The rest needs a current plan.</p>
        </Section>

        <Section id="payment" title="Paying">
          <p>
            Prices are shown on the{" "}
            <Link href="/pricing" className="font-semibold text-primary hover:text-primary-hover">
              pricing page
            </Link>{" "}
            in {payments.currency || "birr"}. Payment is by bank transfer or mobile wallet: you send the amount, upload the receipt, and an
            administrator confirms it, usually {payments.reviewTime || "within a day"}. Access opens when it is confirmed, not when you send
            the money.
          </p>
          <p>
            A receipt that cannot be matched to a real transfer will be refused. Submitting a false or altered receipt closes the account.
          </p>
        </Section>

        <Section id="refunds" title="Refunds">
          <p>
            Because access is granted immediately on confirmation, payments are not refundable once access has opened. If you were charged
            twice, charged the wrong amount, or your access never opened, tell us and we will put it right.
          </p>
          <p>
            Discount codes and referral rewards apply as described when you use them, cannot be combined, and have no cash value. We may
            withdraw a code at any time before it is used.
          </p>
        </Section>

        <Section id="content" title="The material is ours">
          <p>
            The questions, explanations, cases, cheat sheets and videos on this site are our property or used with permission. You may use
            them to study. You may not copy, record, republish, resell or share them, or use them to train a machine-learning model.
          </p>
          <p>
            Downloading the question bank in bulk, scraping the site or sharing your login so others can read the material are each grounds
            for closing the account without a refund.
          </p>
        </Section>

        <Section id="no-promise" title="What we do not promise">
          <p>
            <strong className="text-ink">We do not promise you will pass.</strong> Nothing on this site is a guarantee of an exam result.
            The material is preparation, practice and explanation; the exam is sat by you, under conditions we do not control.
          </p>
          <p>
            Nothing here is medical advice or a substitute for clinical judgement, your institution&apos;s policies, or the instructions of a
            qualified supervisor. Explanations are written for an examination, not for the care of a real patient.
          </p>
          <p>
            We aim for accuracy and correct errors when they are reported, but we cannot warrant that every explanation is free of mistakes
            or that the site will be available without interruption.
          </p>
        </Section>

        <Section id="trademarks" title="NCLEX® and other trademarks">
          <p>
            NCLEX-RN® and NCLEX-PN® are registered trademarks of the National Council of State Boards of Nursing. {name} is not affiliated
            with, endorsed by or approved by the NCSBN. The marks are used only to say which examination this material prepares you for.
          </p>
        </Section>

        <Section id="liability" title="Liability">
          <p>
            Where the law allows it to be limited, our liability to you is limited to what you have paid us in the twelve months before the
            claim. We are not liable for indirect losses, or for a lost or failed examination.
          </p>
        </Section>

        <Section id="ending" title="Ending it">
          <p>
            You may stop using the site and ask us to close your account at any time. We may suspend or close an account that breaks these
            terms, in which case the paid period is not refunded.
          </p>
        </Section>

        <Section id="changes" title="Changes">
          <p>
            We may change these terms. The date at the top changes with them, and a change that affects what you have already paid for will
            not be applied to that period retrospectively.
          </p>
        </Section>

        <Section id="contact" title="Contact">
          <p>
            Questions about these terms:{" "}
            <Link href="/contact" className="font-semibold text-primary hover:text-primary-hover">
              get in touch
            </Link>
            .
          </p>
          <p className="text-sm text-faint">
            These terms have not been reviewed by a lawyer, and will be before {name} is opened to the public.
          </p>
        </Section>
      </Prose>
    </main>
  );
}
