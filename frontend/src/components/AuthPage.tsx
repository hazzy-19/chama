import Login from "./Login";
import { Button } from "./ui/button";

interface AuthPageProps {
  mode: "sign-in" | "sign-up";
  onModeChange: (mode: "sign-in" | "sign-up") => void;
  onBack: () => void;
}

const AuthPage = ({ mode, onModeChange, onBack }: AuthPageProps) => {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 rounded-[2rem] bg-white/95 px-6 py-10 shadow-soft backdrop-blur-xl border border-slate-200/80 sm:px-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-red-700">Secure savings</p>
          <h2 className="text-4xl font-semibold text-slate-950">Sign in or create your account</h2>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            This platform guards your savings with guardian approval and WhatsApp-backed withdrawal requests.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant={mode === "sign-in" ? "default" : "outline"} onClick={() => onModeChange("sign-in")}>Sign in</Button>
          <Button variant={mode === "sign-up" ? "default" : "outline"} onClick={() => onModeChange("sign-up")}>Sign up</Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] bg-surface p-8 shadow-soft border border-slate-200/80">
          <p className="text-sm uppercase tracking-[0.3em] text-primary/90">Why choose this app?</p>
          <ul className="mt-6 space-y-4 text-slate-700">
            <li>• Guardian approval for withdrawals via WhatsApp.</li>
            <li>• Transparent savings targets and due date tracking.</li>
            <li>• Simple, secure account access with Firebase auth.</li>
          </ul>
        </div>
        <div className="rounded-[2rem] bg-red-600 p-8 text-white shadow-soft">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-red-100">Getting started</p>
            <h3 className="text-3xl font-semibold">Quick account setup</h3>
            <p className="text-sm leading-7 text-red-100">
              Create a profile, add your guardian, and start saving toward your first target instantly.
            </p>
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-white/70">Top tip</p>
              <p className="mt-2 text-sm text-white/90">
                Always assign a trusted guardian to approve withdrawals and keep your goals on track.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Button variant="outline" className="w-max" onClick={onBack}>Back to overview</Button>
      <Login initialMode={mode} />
    </div>
  );
};

export default AuthPage;
