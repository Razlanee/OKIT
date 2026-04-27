import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
              OK
            </div>
            <span className="text-xl font-bold">OKIT LTMS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/request-account"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              Request Account
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm mb-6">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Enterprise-grade SaaS Platform
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight">
              Learning & Training
              <br />
              <span className="text-blue-400">Management System</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-2xl leading-relaxed">
              A multi-tenant platform built on Zero-Trust principles. Manage
              enrollment, finances, academics, and certifications — all with
              strict role segregation and automated enforcement gates.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/request-account"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Get Started for Your Institution
              </Link>
              <Link
                href="#features"
                className="px-6 py-3 border border-white/20 hover:bg-white/10 rounded-lg font-medium transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-16">
            Built on Zero-Trust Principles
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Financial Integrity",
                desc: "Students cannot access learning materials until financial obligations are cleared. No single person can both assess a fee and collect cash.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
              },
              {
                title: "Academic Integrity",
                desc: "Automated participation tracking enforces a 75% engagement threshold. Final exams lock out students who don't meet the bar.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
              },
              {
                title: "Operational Integrity",
                desc: "Strict role segregation prevents internal fraud. Operators, Cashiers, Instructors, and Admins each have carefully bounded permissions.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="text-blue-400 mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-5 gap-6">
            {[
              { phase: "1", title: "Onboard", desc: "Institution signs up, pays via PayMongo" },
              { phase: "2", title: "Build", desc: "Admin sets branding, hierarchy, fees, staff" },
              { phase: "3", title: "Enroll", desc: "Operator registers, Cashier clears payment" },
              { phase: "4", title: "Learn", desc: "Content delivery with participation tracking" },
              { phase: "5", title: "Graduate", desc: "Exam, grading formula, auto-certification" },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold mx-auto mb-3">
                  {step.phase}
                </div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} OKIT LTMS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
