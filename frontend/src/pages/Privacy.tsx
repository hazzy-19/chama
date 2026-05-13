import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();
  const lastUpdated = "13 May 2026";

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-100 sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-slate-900">Lovely</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-slate-50 border-b border-slate-100 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Legal
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-500 text-lg font-medium">
            Last updated: <span className="text-slate-800 font-semibold">{lastUpdated}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-a:text-primary">

          {/* Intro */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 mb-12">
            <p className="text-slate-700 text-lg leading-relaxed m-0">
              Lovely Financial Limited (<strong>"Lovely"</strong>, <strong>"we"</strong>, <strong>"us"</strong>, or <strong>"our"</strong>) is committed to protecting the personal data of our users in full compliance with the <strong>Kenya Data Protection Act, 2019 (Cap. 411C)</strong> and the regulations made thereunder. This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use our platform at <strong>lovely.co.ke</strong> and our mobile application.
            </p>
          </div>

          <Section title="1. Who We Are">
            <p>
              Lovely Financial Limited is a financial technology company incorporated in Kenya, providing a digital savings platform with Guardian-mode withdrawal controls. We are registered as a data controller with the Office of the Data Protection Commissioner (ODPC) of Kenya.
            </p>
            <p>
              <strong>Data Controller:</strong> Lovely Financial Limited<br />
              <strong>Registered Address:</strong> Nairobi, Kenya<br />
              <strong>Contact:</strong>{" "}
              <a href="mailto:privacy@lovely.co.ke" className="text-primary hover:underline">
                privacy@lovely.co.ke
              </a>
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect the following categories of personal data:</p>
            <SubSection title="2.1 Information You Provide">
              <ul>
                <li><strong>Account information:</strong> Full name, email address, phone number, and password (hashed and never stored in plain text).</li>
                <li><strong>Identity data:</strong> Where required by law (KYC/AML), National ID or Passport number.</li>
                <li><strong>Guardian information:</strong> Name and phone number of your designated Guardian who approves withdrawal requests.</li>
                <li><strong>Transaction data:</strong> Amounts, timestamps, and descriptions of deposits and withdrawal requests you initiate.</li>
                <li><strong>Savings goals:</strong> Target amounts and dates you set within the platform.</li>
              </ul>
            </SubSection>
            <SubSection title="2.2 Data Collected Automatically">
              <ul>
                <li><strong>Device information:</strong> IP address, browser type, operating system, device identifiers.</li>
                <li><strong>Usage data:</strong> Pages visited, features used, session duration, and click patterns.</li>
                <li><strong>Log data:</strong> Server logs including API request timestamps and error reports.</li>
              </ul>
            </SubSection>
            <SubSection title="2.3 Payment Data (M-Pesa)">
              <p>
                When you make a deposit via M-Pesa, your phone number and transaction reference are processed by <strong>Safaricom PLC</strong> and their Daraja API. We receive a transaction confirmation from Safaricom but <strong>we do not store your M-Pesa PIN</strong> at any time. Payment processing is governed by Safaricom's own Privacy Policy.
              </p>
            </SubSection>
          </Section>

          <Section title="3. How We Use Your Data">
            <p>We process your personal data under the following lawful bases (as required by Section 30 of the Data Protection Act, 2019):</p>
            <table className="w-full text-sm border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-800 border-b border-slate-200">Purpose</th>
                  <th className="text-left p-4 font-bold text-slate-800 border-b border-slate-200">Lawful Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["Provide and operate the savings platform", "Contract performance"],
                  ["Process M-Pesa deposits and withdrawal requests", "Contract performance"],
                  ["Send Guardian approval notifications via WhatsApp/SMS", "Contract performance"],
                  ["Send email/SMS verification upon account creation", "Contract performance"],
                  ["Fraud prevention and security monitoring", "Legitimate interest"],
                  ["Comply with Kenya's AML/CFT regulations", "Legal obligation"],
                  ["Send product updates and service notices", "Legitimate interest (opt-out available)"],
                  ["Improve platform features using aggregated analytics", "Legitimate interest"],
                ].map(([purpose, basis], i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-700">{purpose}</td>
                    <td className="p-4 text-slate-500 font-medium">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="4. Data Sharing">
            <p>We <strong>do not sell your personal data</strong>. We may share your information with the following parties, strictly as necessary:</p>
            <ul>
              <li><strong>Safaricom PLC:</strong> For processing M-Pesa payments via the Daraja API.</li>
              <li><strong>Google Firebase (Google LLC):</strong> For authentication services, hosted in compliance with Google's data processing terms. Data may be processed outside Kenya but Google is a party to the EU-U.S. Data Privacy Framework, providing adequate protection.</li>
              <li><strong>Your designated Guardian:</strong> We send your Guardian notifications (name and withdrawal request details) when you initiate a withdrawal request. Your Guardian's contact information is used solely for this purpose.</li>
              <li><strong>Legal and regulatory authorities:</strong> Including the Central Bank of Kenya (CBK), Kenya Revenue Authority (KRA), and ODPC where required by law.</li>
              <li><strong>Cloud infrastructure providers:</strong> Our backend servers are hosted on reputable cloud infrastructure with data processing agreements in place.</li>
            </ul>
          </Section>

          <Section title="5. Account Verification">
            <p>
              To protect our users and prevent fraudulent accounts, we require verification of the contact information used to create an account:
            </p>
            <ul>
              <li><strong>Email addresses:</strong> We send a verification link to your email upon registration. You must click this link to fully activate your account.</li>
              <li><strong>Phone numbers:</strong> We use Firebase Phone Authentication (SMS OTP) to verify phone numbers used for account creation or login.</li>
            </ul>
            <p>
              Unverified accounts will have limited access to the platform's features. We reserve the right to suspend or terminate accounts where verification fails.
            </p>
          </Section>

          <Section title="6. Data Retention">
            <p>We retain your personal data for as long as necessary for the purposes described in this policy, subject to the following:</p>
            <ul>
              <li><strong>Active account data:</strong> Retained for the duration of your account's existence.</li>
              <li><strong>Transaction records:</strong> Retained for a minimum of <strong>7 years</strong> to comply with Kenya's Proceeds of Crime and Anti-Money Laundering Act (POCAMLA) requirements.</li>
              <li><strong>Closed account data:</strong> Retained for 7 years post-closure for legal and regulatory compliance.</li>
              <li><strong>Analytics data:</strong> Aggregated, anonymized data may be retained indefinitely.</li>
            </ul>
          </Section>

          <Section title="7. Your Rights Under the Data Protection Act, 2019">
            <p>As a data subject in Kenya, you have the following rights under Sections 26–34 of the Data Protection Act, 2019:</p>
            <ul>
              <li><strong>Right to be informed:</strong> To know how your data is being used (this Policy fulfills this).</li>
              <li><strong>Right of access:</strong> To request a copy of all personal data we hold about you.</li>
              <li><strong>Right to rectification:</strong> To request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to erasure:</strong> To request deletion of your data, subject to legal retention requirements.</li>
              <li><strong>Right to object:</strong> To object to processing based on legitimate interests, including direct marketing.</li>
              <li><strong>Right to restrict processing:</strong> To request that we limit how we use your data in certain circumstances.</li>
              <li><strong>Right to data portability:</strong> To receive your data in a structured, machine-readable format.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@lovely.co.ke" className="text-primary hover:underline font-semibold">
                privacy@lovely.co.ke
              </a>
              . We will respond within <strong>21 days</strong> as required by the Act. You may also lodge a complaint with the <strong>Office of the Data Protection Commissioner (ODPC)</strong> at{" "}
              <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                www.odpc.go.ke
              </a>.
            </p>
          </Section>

          <Section title="8. Security">
            <p>We implement industry-standard security measures to protect your data, including:</p>
            <ul>
              <li>TLS/HTTPS encryption for all data in transit.</li>
              <li>Firebase Authentication with session-only persistence — your session is cleared when you log out.</li>
              <li>Passwords are hashed using Firebase's built-in bcrypt-based hashing and are never stored in plain text.</li>
              <li>All API endpoints require a valid Firebase ID token — unauthenticated requests are rejected.</li>
              <li>Regular security audits and vulnerability assessments.</li>
            </ul>
            <p>
              Despite our efforts, no digital system is 100% secure. If you discover a vulnerability, please report it responsibly to{" "}
              <a href="mailto:security@lovely.co.ke" className="text-primary hover:underline">security@lovely.co.ke</a>.
            </p>
          </Section>

          <Section title="9. Cookies and Tracking">
            <p>
              We use minimal session cookies and browser local storage to maintain your authenticated session. We do <strong>not</strong> use advertising trackers or third-party marketing cookies. Our analytics, if any, use aggregated and anonymized data only.
            </p>
          </Section>

          <Section title="10. Children's Privacy">
            <p>
              Lovely is intended for users who are <strong>18 years of age or older</strong>. We do not knowingly collect personal data from minors. If we discover that a user is under 18, we will immediately deactivate their account and delete their data. If you believe a minor has created an account, contact us at{" "}
              <a href="mailto:privacy@lovely.co.ke" className="text-primary hover:underline">privacy@lovely.co.ke</a>.
            </p>
          </Section>

          <Section title="11. Cross-Border Data Transfers">
            <p>
              Some of our service providers (notably Google Firebase) may process data outside Kenya. Where this occurs, we ensure adequate safeguards are in place, including standard contractual clauses or participation in recognized data transfer frameworks, as contemplated under Section 48 of the Data Protection Act, 2019.
            </p>
          </Section>

          <Section title="12. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of material changes via email or an in-app notice at least <strong>14 days</strong> before the changes take effect. Your continued use of our platform after the effective date constitutes acceptance of the updated Policy.
            </p>
          </Section>

          <Section title="13. Contact Us">
            <p>For any questions, concerns, or requests regarding this Privacy Policy or your personal data:</p>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 not-prose">
              <div className="space-y-2 text-slate-700 text-sm font-medium">
                <p className="text-xl font-extrabold text-slate-900 mb-4">Lovely Financial Limited</p>
                <p>📧 <a href="mailto:privacy@lovely.co.ke" className="text-primary hover:underline">privacy@lovely.co.ke</a></p>
                <p>🌐 <a href="https://lovely.co.ke" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">lovely.co.ke</a></p>
                <p>📍 Nairobi, Kenya</p>
              </div>
            </div>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-10 px-6">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-slate-900">Lovely</span>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Lovely Financial Limited. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-5 pb-3 border-b border-slate-100">{title}</h2>
      <div className="space-y-4 text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-lg font-bold text-slate-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}
