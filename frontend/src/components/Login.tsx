import { useState, type ChangeEvent, type FormEvent } from "react";
import { signUp, signIn } from "../services/firebase";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface LoginProps {
  initialMode?: "sign-in" | "sign-up";
}

const Login = ({ initialMode = "sign-in" }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(initialMode === "sign-up");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[66vh] items-center justify-center">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] bg-red-600 p-10 text-white shadow-soft">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-700 px-4 py-2 text-sm uppercase tracking-[0.3em] text-white/90">
              Guardian-backed savings
            </div>
            <div>
              <h2 className="text-4xl font-bold tracking-tight">{isSignUp ? "Start saving with approval" : "Welcome back"}</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-red-100">
                {isSignUp
                  ? "Create your account, assign a guardian, and begin saving with withdrawal protection."
                  : "Sign in to view your balance, guardian approvals, and WhatsApp-backed withdrawal requests."}
              </p>
            </div>
          </div>
          <div className="mt-10 rounded-3xl bg-white/10 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-red-100/80">Platform highlights</p>
            <ul className="mt-4 space-y-3 text-sm text-red-100/80">
              <li>• Red + teal authority and clarity.</li>
              <li>• Automatic guardian approval workflow.</li>
              <li>• Zero balance tracking and savings target visibility.</li>
            </ul>
          </div>
        </section>

        <Card className="bg-surface">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-primary/80">{isSignUp ? "Create account" : "Sign in"}</p>
                <h3 className="mt-2 text-3xl font-semibold text-slate-950">{isSignUp ? "Join the savings plan" : "Access your dashboard"}</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? "Switch to sign in" : "Switch to sign up"}
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="hello@example.com"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-3xl border border-slate-200 bg-surface px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-3xl border border-slate-200 bg-surface px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid gap-4">
                <Button type="submit" size="lg" className="w-full">
                  {loading ? "Working…" : isSignUp ? "Create account" : "Sign in"}
                </Button>
                {error && <p className="text-sm text-danger">{error}</p>}
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
