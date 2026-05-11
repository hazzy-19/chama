import { useSearchParams, useNavigate } from "react-router-dom";
import { signUp as firebaseSignUp, signIn as firebaseSignIn, signInWithGoogle } from "../services/firebase";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { useAuthContext } from "../context/AuthContext";

const normalizeIdentifier = (input: string) => {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }
  const phone = trimmed.replace(/\D/g, "");
  return `${phone}@chama.app`;
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    (searchParams.get("mode") as "signin" | "signup") || "signin"
  );
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formattedIdentifier = normalizeIdentifier(identifier);
      if (mode === "signup") {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        await firebaseSignUp(formattedIdentifier, password);
      } else {
        await firebaseSignIn(formattedIdentifier, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-8">
              <button
                type="button"
                onClick={() => navigate(user ? "/dashboard" : "/")}
                className="rounded-full bg-teal-700 px-3 py-1 text-white font-semibold text-sm hover:bg-teal-600"
              >
                CHAMA
              </button>
            </div>
            <h1 className="text-3xl font-bold text-slate-950 mb-2">
              {mode === "signin" ? "Welcome back" : "Start saving"}
            </h1>
            <p className="text-slate-600">
              {mode === "signin"
                ? "Sign in to your savings account"
                : "Create your account and set your savings goal"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-700">
                Email address or phone number
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or +254712345678"
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-16 text-slate-900 shadow-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <div className="relative mt-2">
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-16 text-slate-900 shadow-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-900 font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white hover:bg-red-700 font-semibold py-3 rounded-2xl"
            >
              {loading
                ? "Loading..."
                : mode === "signin"
                ? "Sign in"
                : "Create account"}
            </Button>
          </form>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            >
              Continue with Google
            </Button>
          </div>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-red-600 font-semibold hover:underline"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

        {/* Feature Highlights - Below on mobile */}
        <div className="mt-12 lg:hidden w-full max-w-sm mx-auto lg:mx-0">
          <h3 className="font-semibold text-slate-950 mb-4">What you get:</h3>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <span className="text-red-600 font-bold mt-0.5">✓</span>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Track savings</span> - Monitor your balance in real-time
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-teal-700 font-bold mt-0.5">✓</span>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Guardian protection</span> - Approve withdrawals via WhatsApp
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-red-600 font-bold mt-0.5">✓</span>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Seamless deposit and withdrawal</span> - Manage your savings conveniently
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-teal-700 font-bold mt-0.5">✓</span>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Flexible login</span> - Sign in with Google, email, or phone
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Image (Desktop Only) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-red-50 to-teal-50 items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Design Elements */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Solid red circle */}
            <div className="absolute top-20 right-20 w-48 h-48 rounded-full bg-red-600 opacity-10"></div>
            {/* Solid teal circle */}
            <div className="absolute bottom-32 left-20 w-64 h-64 rounded-full bg-teal-700 opacity-10"></div>

            {/* Content */}
            <div className="relative z-10 max-w-md text-center px-6">
              <h2 className="text-3xl font-bold text-slate-950 mb-6">
                Save with Purpose
              </h2>

              {/* Cards showcase */}
              <div className="space-y-4 mb-8">
                <div className="rounded-2xl bg-white p-4 shadow-lg border border-slate-200">
                  <p className="text-xs uppercase tracking-[0.15em] text-red-700 font-semibold">
                    Current balance
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">0 KES</p>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-lg border border-slate-200">
                  <p className="text-xs uppercase tracking-[0.15em] text-teal-700 font-semibold">
                    Your goal
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">5,000 KES</p>
                </div>

                <div className="rounded-2xl bg-red-600 text-white p-4 shadow-lg">
                  <p className="text-xs uppercase tracking-[0.15em] font-semibold">
                    Guardian ready
                  </p>
                  <p className="mt-2 text-lg font-bold">Protected withdrawals</p>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                Reach your savings goal with guardian protection ensuring you stay disciplined.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
