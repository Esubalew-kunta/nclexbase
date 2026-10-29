"use client";

import Link from "next/link";
import { PageHeader, Prose, Section, Updated } from "@/components/site/Prose";
import { SITE_NAME } from "@/lib/brand";
import { useConfig } from "@/lib/content";

/*
 * Privacy policy.
 *
 * Written against what the software actually does, which is why it is specific: the account
 * fields the API stores, the session cookie Sanctum sets, the receipt files a payment needs,
 * and the deliberate absence of analytics. A policy copied from a template would claim
 * trackers we do not run and say nothing about the receipt photos, which are the most
 * sensitive thing here.
 *
 * It is not legal advice and has not been reviewed by a lawyer. That is said on the page
 * rather than hidden, and it is on PROGRESS.md as an open item before the site goes public.
 */

/** Change this when the policy changes. A legal page with a stale date is worse than none. */
const UPDATED = "29 October 2026";

export default function PrivacyPage() {
  const { branding } = useConfig();
  const name = branding.siteName || SITE_NAME;
  const email = branding.supportEmail;

  return (
    <main>
      <PageHeader eyebrow="Legal" title="Privacy policy" intro={`What ${name} collects, why, and what it does not do with it.`} />

      <Prose>
        <Updated date={UPDATED} />

        <Section id="short" title="The short version">
          <p>
            We store the account you create and the studying you do, because the product does not work otherwise. We do not run analytics,
            we do not use advertising trackers, and we do not sell or share your data with anyone who wants to market to you.
          </p>
          <p>This site is also deliberately kept out of search engines, so nothing here is indexed or archived by them.</p>
        </Section>

        <Section id="collect" title="What we collect">
          <p>
            <strong className="text-ink">Your account.</strong> Your name, email address and a one-way hash of your password. We never hold
            the password itself and cannot read it.
          </p>
          <p>
            <strong className="text-ink">Your studying.</strong> The tests you build, the answers you give, your scores and your study
            schedule. This is what produces your performance pages, so it is kept against your account.
          </p>
          <p>
            <strong className="text-ink">Payments.</strong> If you buy a plan, we store the plan, the amount, the method, any transaction
            reference you type and the receipt file you upload. Receipts are held privately and are reachable only by an administrator
            reviewing your payment. We never see or store your card or wallet credentials — the transfer happens at your bank or wallet, not
            here.
          </p>
          <p>
            <strong className="text-ink">Technical records.</strong> Our server keeps ordinary request and error logs, which include IP
            addresses, so that faults can be diagnosed and abuse stopped.
          </p>
        </Section>

        <Section id="cookies" title="Cookies">
          <p>
            One session cookie, set when you log in, so the site knows it is still you between pages. One security cookie that protects
            forms from being submitted by another site on your behalf. Nothing else — no advertising or analytics cookies, because we run
            neither.
          </p>
          <p>
            Your browser also keeps some of your own settings and unsent work locally, on your device. That never reaches us and clearing
            your browser data removes it.
          </p>
        </Section>

        <Section id="why" title="Why we hold it">
          <p>
            To give you an account you can come back to, to show you your own progress, to confirm a payment and open the access you paid
            for, to answer you when you write to us, and to keep the service working and secure. Nothing is collected for any other reason.
          </p>
        </Section>

        <Section id="sharing" title="Who else sees it">
          <p>
            Our hosting provider, because the site runs on their servers, and an email provider, because password resets and verification
            links have to be delivered. They handle your data to provide those services and for nothing else.
          </p>
          <p>We do not sell your data. We do not share it for advertising. There are no third-party trackers on this site.</p>
        </Section>

        <Section id="keeping" title="How long we keep it">
          <p>
            Your account and your study history stay while your account exists. Payment records, including receipts, are kept as long as
            accounting requires. Ask us to delete your account and we delete it and your study history, keeping only what a payment record
            must retain.
          </p>
        </Section>

        <Section id="rights" title="Your choices">
          <p>
            You can see and change your account details on your profile page, and you can ask us for a copy of what we hold or for your
            account to be deleted. Write to{" "}
            {email ? (
              <a href={`mailto:${email}`} className="font-semibold text-primary hover:text-primary-hover">
                {email}
              </a>
            ) : (
              "our support address"
            )}{" "}
            and we will confirm when it is done.
          </p>
        </Section>

        <Section id="security" title="Security">
          <p>
            Traffic is encrypted in transit. Passwords are hashed, never stored. Uploaded receipts are private rather than public files.
            Administrator access is restricted and every administrative change is recorded with who made it.
          </p>
        </Section>

        <Section id="children" title="Children">
          <p>
            This is a study site for nurses and nursing students and is not intended for children. We do not knowingly collect data from
            anyone under 16.
          </p>
        </Section>

        <Section id="changes" title="Changes to this policy">
          <p>
            If this policy changes in a way that matters, the date at the top changes with it and we will say so on the site rather than
            quietly amending the text.
          </p>
        </Section>

        <Section id="contact" title="Contact">
          <p>
            Anything about this policy or your data:{" "}
            <Link href="/contact" className="font-semibold text-primary hover:text-primary-hover">
              get in touch
            </Link>
            .
          </p>
          <p className="text-sm text-faint">
            This policy describes how the site actually works and is written in plain language. It has not been reviewed by a lawyer, and
            will be before {name} is opened to the public.
          </p>
        </Section>
      </Prose>
    </main>
  );
}
