import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAuthContext } from "../context/AuthContext";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const showHeroSection = !user;

  const features = [
    {
      title: "Track Your Savings",
      description: "See your current balance, savings goal, and progress in real-time.",
      icon: "💰",
    },
    {
      title: "Deposit + Withdrawal",
      description: "Enjoy seamless deposits and withdrawals through M-Pesa.",
      icon: "📱",
    },
    {
      title: "Guardian Protection",
      description: "Assign a trusted guardian who approves withdrawals and protects your goal.",
      icon: "🛡️",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8 dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(user ? "/dashboard" : "/")}
              className="rounded-full bg-teal-700 px-3 py-1 text-white font-semibold hover:bg-teal-600"
            >
              CHAMA
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="border-slate-300 bg-white text-slate-950 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {isDarkMode ? "Light mode" : "Dark mode"}
            </Button>
          </div>
        </div>
      </header>

      {showHeroSection && (
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl md:text-6xl dark:text-slate-100">
              Save Money <span className="text-red-600">Smarter</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-8 dark:text-slate-300">
              A savings platform with guardian protection. Set a goal, assign a guardian to approve withdrawals, and reach your target without temptation.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="default"
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-red-600 text-white hover:bg-red-700 text-base px-8 py-3"
              >
                Get started
              </Button>
              <Button
                variant="default"
                onClick={() => navigate("/auth?mode=signin")}
                className="border border-slate-300 bg-white text-slate-950 hover:bg-slate-50 text-base px-8 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Sign in
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Balance Preview Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-slate-950 mb-8 text-center dark:text-slate-100">
            Your Dashboard Preview
          </h2>
          <Card className="bg-white p-8 dark:bg-slate-800">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">
                  Current balance
                </p>
                <p className="mt-4 text-4xl font-semibold text-slate-950 dark:text-slate-100">
                  0 shillings
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">
                  Savings target
                </p>
                <p className="mt-4 text-4xl font-semibold text-slate-950 dark:text-slate-100">
                  5,000
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 dark:bg-slate-950 dark:border-slate-700">
              <p className="text-sm text-red-900 dark:text-slate-200">
                ✓ Set your goal during signup
              </p>
              <p className="text-sm text-red-900 mt-2 dark:text-slate-200">
                ✓ Deposits handled via M-Pesa
              </p>
              <p className="text-sm text-red-900 mt-2 dark:text-slate-200">
                ✓ Guardian approval required for withdrawals
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-slate-50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-slate-950 mb-4">
            Core Features
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Everything you need to save with confidence and reach your financial goals.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-white p-6 dark:bg-slate-800 dark:border dark:border-slate-700">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-slate-950 mb-2 dark:text-slate-100">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-slate-950 mb-12 text-center">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="rounded-full bg-red-600 text-white w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-slate-950 mb-2">Create Account</h3>
              <p className="text-sm text-slate-600">
                Sign up with your phone number and set your savings goal.
              </p>
            </div>
            <div className="text-center">
              <div className="rounded-full bg-teal-700 text-white w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-slate-950 mb-2">Assign Guardian</h3>
              <p className="text-sm text-slate-600">
                Choose a trusted guardian to approve withdrawal requests via WhatsApp.
              </p>
            </div>
            <div className="text-center">
              <div className="rounded-full bg-red-600 text-white w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-slate-950 mb-2 dark:text-slate-100">Deposit & withdraw</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Deposit via M-Pesa and make withdrawals securely as needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-950 mb-4">
            Ready to Save with Purpose?
          </h2>
          <p className="text-slate-600 mb-8">
            Join thousands of savers protecting their goals with guardian support.
          </p>
          <Button
            variant="default"
            onClick={() => navigate("/auth?mode=signup")}
            className="bg-red-600 text-white hover:bg-red-700 text-base px-12 py-3"
          >
            Create Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-slate-600">
          <p>&copy; 2026 CHAMA Savings. Protecting your goals, one deposit at a time.</p>
        </div>
      </footer>
    </div>
  );
}
