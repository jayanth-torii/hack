import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply when you use Vidhyora, the AI learning roadmap generator and study planner.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm opacity-70">Last updated: November 2026</p>

      <section className="mt-8 space-y-3">
        <p>
          These terms apply to your use of Vidhyora (https://vidhyora.vercel.app),
          an AI learning roadmap generator and study planner built by Jayanth.
          By using the service you agree to these terms.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Using Vidhyora</h2>
        <p>
          You may use Vidhyora for personal learning and planning. You agree to
          provide accurate account information, keep your sign-in secure and
          not misuse the service, for example by attempting to disrupt it,
          access other accounts or use it for unlawful purposes.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">AI-generated content</h2>
        <p>
          Roadmaps and recommendations are generated with the help of AI and
          may contain mistakes or outdated links. They are provided for
          guidance only, so please verify important information before relying
          on it.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Google services</h2>
        <p>
          If you sign in with Google or connect Google Calendar, you authorise
          Vidhyora to access only the data described in our Privacy Policy. You
          can revoke this access at any time at
          https://myaccount.google.com/permissions.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Your content</h2>
        <p>
          You keep ownership of the goals and other content you submit. You
          grant us permission to store and process it as needed to run the
          service for you.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Availability and changes</h2>
        <p>
          The service is provided as is, without warranties of any kind, and
          may change, be interrupted or be discontinued at any time. To the
          extent permitted by law, we are not liable for indirect or
          consequential losses arising from your use of Vidhyora.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Termination</h2>
        <p>
          You may stop using Vidhyora at any time and can ask us to delete your
          account by emailing jayanth.m003@gmail.com. We may suspend accounts
          that break these terms.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          We may update these terms and will change the date above when we do.
          Questions can be sent to jayanth.m003@gmail.com.
        </p>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/" className="underline">
          Back to Vidhyora
        </Link>
        {" · "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
      </p>
    </main>
  );
}
