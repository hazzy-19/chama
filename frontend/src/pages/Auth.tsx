import { useSearchParams, useNavigate } from "react-router-dom";
import { signUp as firebaseSignUp, signIn as firebaseSignIn, signInWithGoogle } from "../services/firebase";
import { useState } from "react";
import { ShieldCheck, Eye, EyeOff, Loader2, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../services/firebase";

const normalizeIdentifier = (input: string) => {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }
  const phone = trimmed.replace(/\D/g, "");
  return `${phone}@lovely.app`;
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
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedIdentifier = normalizeIdentifier(identifier);
      if (mode === "signup") {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }
        const cred = await firebaseSignUp(formattedIdentifier, password);
        // Send email verification if it's a real email
        if (identifier.trim().includes("@") && cred.user) {
          await sendEmailVerification(cred.user);
          setVerificationSent(true);
          return;
        }
        toast.success("Account created successfully!");
        navigate("/dashboard");
      } else {
        await firebaseSignIn(formattedIdentifier, password);
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        toast.success("Verification email resent!");
      }
    } catch {
      toast.error("Could not resend email. Please try again shortly.");
    } finally {
      setResending(false);
    }
  };

  // Email verification sent screen
  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-10 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Check your inbox</h1>
          <p className="text-slate-500 mb-2">We sent a verification link to</p>
          <p className="font-bold text-slate-800 mb-6 break-all">{identifier.trim()}</p>
          <p className="text-sm text-slate-500 mb-8">
            Click the link in the email to activate your account. Once verified, you can sign in below.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => { setVerificationSent(false); setMode("signin"); }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-[0.98]"
            >
              Go to Sign In
            </button>
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium py-3 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Resend Email
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans bg-slate-100">
      {/* Left side — image panel (desktop only) */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        <img
          src="/holding%20phone%201.jpg"
          alt="Lovely Savings"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-900/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-primary" /> Guardian Mode Protected
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-3">
            Your savings,<br />locked in.
          </h2>
          <p className="text-white/70 text-lg font-medium max-w-md">
            Build real discipline. Your guardian approves every withdrawal.
          </p>
        </div>
      </div>

      {/* Right side — card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 lg:p-10"
        >
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer mb-10 group w-fit"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
            <div className="bg-primary p-1.5 rounded-lg ml-1">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">Lovely</span>
          </div>

          {/* Title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1.5">
                {mode === "signin" ? "Welcome back" : "Start saving smarter"}
              </h1>
              <p className="text-slate-500 text-sm">
                {mode === "signin"
                  ? "Sign in to access your protected savings."
                  : "Create your account and reach your financial goals."}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email or phone number
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or +254712345678"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {mode === "signin" && (
              <div className="text-right -mt-2">
                <button type="button" className="text-xs text-primary font-semibold hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2 mt-2 shadow-lg shadow-slate-900/20"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-slate-400 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-5 w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold py-3 rounded-2xl transition-all active:scale-[0.98] flex justify-center items-center gap-3 text-sm shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* Toggle */}
          <p className="mt-6 text-center text-slate-500 text-sm">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary font-bold hover:underline"
            >
              {mode === "signin" ? "Sign up free" : "Sign in"}
            </button>
          </p>

          {/* Privacy */}
          <p className="mt-4 text-center text-xs text-slate-400">
            By continuing, you agree to our{" "}
            <button onClick={() => navigate("/privacy")} className="underline hover:text-primary transition-colors">
              Privacy Policy
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
