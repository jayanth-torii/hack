import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Vidhyora collects, uses and protects your information, including Google account and Google Calendar data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm opacity-70">Last updated: November 2026</p>

      <section className="mt-8 space-y-3">
        <p>
          Vidhyora (https://vidhyora.vercel.app) is an AI learning roadmap
          generator and study planner built by Jayanth. This policy explains
          what information we collect, how we use it and the choices you have.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Information we collect</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Account information: your name, email address and profile picture
            when you sign up or choose Continue with Google.
          </li>
          <li>
            Content you create: the learning goals you enter and the roadmaps
            you generate or save.
          </li>
          <li>
            Technical data: authentication cookies that keep you signed in, and
            basic logs needed to run and secure the service.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Google user data</h2>
        <p>
          If you sign in with Google, we receive your basic profile (name, email
          address and profile picture) using the openid, email and profile
          scopes. We use it only to create and identify your account.
        </p>
        <p>
          If you choose to connect Google Calendar, we request the calendar
          events scope so Vidhyora can add study sessions from your roadmap to
          your calendar. We only create and manage the study events that
          Vidhyora adds. We do not read, share or use your other calendar data
          for anything else.
        </p>
        <p>
          Vidhyora use and transfer of information received from Google APIs
          adheres to the Google API Services User Data Policy, including the
          Limited Use requirements. We do not sell Google user data, do not use
          it for advertising and do not allow humans to read it except where
          you give consent, it is needed for security or support, or the law
          requires it.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">How we use information</h2>
        <p>
          We use your information to provide and improve Vidhyora, to save your
          roadmaps, to keep your account secure and to respond to your
          questions. We do not sell your personal information.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Sharing</h2>
        <p>
          We share information only with service providers that help us run the
          product, such as hosting and AI providers, and only as needed to
          deliver the service, or when required by law.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Retention and deletion</h2>
        <p>
          We keep your data while your account is active. You can ask us to
          delete your account and data at any time by emailing
          jayanth.m003@gmail.com. You can also revoke Vidhyora access to your
          Google account at https://myaccount.google.com/permissions.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Security</h2>
        <p>
          We use HTTPS and httpOnly cookies and follow reasonable practices to
          protect your information, but no method of transmission or storage is
          completely secure.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Changes and contact</h2>
        <p>
          We may update this policy and will change the date above when we do.
          Questions can be sent to jayanth.m003@gmail.com.
        </p>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/" className="underline">
          Back to Vidhyora
        </Link>
        {" · "}
        <Link href="/terms" className="underline">
          Terms of Service
        </Link>
      </p>
    </main>
  );
}
