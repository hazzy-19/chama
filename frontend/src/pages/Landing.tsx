import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Lock, TrendingUp, Users, CheckCircle2, Play, Smartphone } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-24">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/")}>
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">Lovely</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(user ? "/dashboard" : "/auth?mode=signin")}
              className="text-base font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              {user ? "Dashboard" : "Log In"}
            </button>
            {!user && (
              <button
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-3 rounded-full transition-all active:scale-95 shadow-md hover:shadow-xl"
              >
                Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40 bg-slate-50">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[100px]" />
              <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-danger/5 blur-[100px]" />
            </div>
            
            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
              <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="max-w-2xl"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-8 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" /> The New Standard in Savings
                  </div>
                  <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl mb-8 leading-[1.1]">
                    The smart way to <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-500">protect</span> your money.
                  </h1>
                  <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg font-medium">
                    Build financial discipline with Guardian Mode. Lock your funds, assign a trusted person, and achieve your goals without giving in to temptation.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => navigate(user ? "/dashboard" : "/auth?mode=signup")}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-lg font-semibold px-8 py-4 rounded-full transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20"
                    >
                      {user ? "Go to Dashboard" : "Open Free Account"} <ArrowRight className="w-5 h-5" />
                    </button>
                    {!user && (
                      <button
                        onClick={() => navigate("/auth?mode=signup")}
                        className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 text-lg font-semibold px-8 py-4 rounded-full transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Play className="w-5 h-5" /> See How It Works
                      </button>
                    )}
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  className="relative lg:h-[650px] flex items-center justify-center"
                >
                  <div className="relative w-full max-w-lg aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-slate-900/5">
                    <img src="/masai%20teens.jpg" alt="Future savers" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                    
                    {/* Floating Element 1 */}
                    <motion.div 
                      animate={{ y: [0, -10, 0] }} 
                      transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                      className="absolute bottom-10 left-8 right-8 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Goal Reached</p>
                          <p className="text-2xl font-bold text-slate-900">KES 150,000</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Floating Element 2 */}
                  <motion.div 
                    animate={{ y: [0, 15, 0] }} 
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
                    className="absolute top-1/4 -left-16 bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 hidden md:block"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-danger" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Guardian Status</p>
                        <p className="text-lg font-bold text-slate-900">Protected</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Stats Bar */}
          <section className="border-y border-slate-200 bg-white py-8">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { value: "KES 2M+", label: "Total Saved" },
                  { value: "500+", label: "Active Users" },
                  { value: "100%", label: "Secure Withdrawals" },
                  { value: "24/7", label: "M-Pesa Integration" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500 font-semibold mt-1 uppercase tracking-wider">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Feature 1 */}
          <section className="py-24 lg:py-32 bg-white overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}
                  className="order-2 lg:order-1 relative rounded-[3rem] overflow-hidden aspect-square lg:aspect-auto lg:h-[700px] shadow-2xl ring-1 ring-slate-900/5"
                >
                  <img src="/black%20girl.jpg" alt="Financial Freedom" className="w-full h-full object-cover" />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}
                  className="order-1 lg:order-2"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">Lock your funds.<br/>Unlock your potential.</h2>
                  <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                    Impulse spending is the enemy of wealth. With Lovely, you set a time or a monetary goal, and your money is securely locked until you achieve it.
                  </p>
                  <ul className="space-y-5 mb-10">
                    {["No early withdrawals without approval", "Build better financial habits over time", "Bank-grade security and transparency"].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-slate-800 font-semibold text-lg">
                        <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Feature 2 */}
          <section className="py-24 lg:py-32 bg-slate-50 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}
                  className=""
                >
                  <div className="w-16 h-16 bg-danger/10 rounded-2xl flex items-center justify-center mb-8">
                    <Users className="w-8 h-8 text-danger" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">The power of<br/>community trust.</h2>
                  <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                    Appoint a Guardian—a trusted friend or family member. Any withdrawal request before your goal is met must be reviewed and approved by them.
                  </p>
                  <button
                     onClick={() => navigate("/auth?mode=signup")}
                     className="text-primary text-lg font-bold flex items-center gap-2 hover:gap-4 transition-all"
                  >
                    Learn about Guardians <ArrowRight className="w-6 h-6" />
                  </button>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}
                  className="relative rounded-[3rem] overflow-hidden aspect-square lg:aspect-auto lg:h-[700px] shadow-2xl ring-1 ring-slate-900/5"
                >
                  <img src="/holding%20phone%201.jpg" alt="Mobile Banking" className="w-full h-full object-cover" />
                </motion.div>
              </div>
            </div>
          </section>

          {/* Big CTA Section (Paypal Style) */}
          <section className="relative py-32 lg:py-48 overflow-hidden bg-slate-900">
            <div className="absolute inset-0">
              <img src="/pexels-kema-14079439.jpg" alt="Background" className="w-full h-full object-cover opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/80" />
            </div>
            <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
              <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-8" />
              <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-8 leading-tight">
                Ready to change how you save?
              </h2>
              <p className="text-2xl text-slate-300 mb-12 max-w-3xl mx-auto font-medium">
                Join the platform that helps you build wealth through discipline and community accountability.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <button
                  onClick={() => navigate(user ? "/dashboard" : "/auth?mode=signup")}
                  className="bg-primary hover:bg-teal-400 text-slate-900 text-xl font-bold px-12 py-5 rounded-full transition-all active:scale-95 shadow-xl shadow-primary/20"
                >
                  {user ? "Go to Dashboard" : "Sign Up for Free"}
                </button>
                {!user && (
                  <button
                    onClick={() => navigate("/auth?mode=signin")}
                    className="bg-transparent border-2 border-white hover:bg-white/10 text-white text-xl font-bold px-12 py-5 rounded-full transition-all active:scale-95"
                  >
                    Log In to Dashboard
                  </button>
                )}
              </div>
            </div>
          </section>
      {/* How It Works */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm font-bold mb-6 uppercase tracking-wider">
              Simple Process
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">How Lovely Works</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">Three simple steps to start saving with discipline.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: <Smartphone className="w-8 h-8 text-primary" />, title: "Create Account", desc: "Sign up with your email or M-Pesa phone number in under 2 minutes." },
              { step: "02", icon: <Users className="w-8 h-8 text-danger" />, title: "Assign a Guardian", desc: "Choose a trusted person. They approve every withdrawal via WhatsApp." },
              { step: "03", icon: <TrendingUp className="w-8 h-8 text-primary" />, title: "Deposit & Grow", desc: "Deposit via M-Pesa STK push. Watch your savings grow towards your goal." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-6xl font-black text-slate-100 mb-4">{item.step}</div>
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-5 -mt-2">
                  {item.icon}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-extrabold text-white">Lovely</span>
            </div>
            <div className="flex gap-8 text-sm font-semibold text-slate-400">
              <button onClick={() => navigate("/privacy")} className="hover:text-primary transition-colors">Privacy Policy</button>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="mailto:hello@lovely.co.ke" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between gap-4">
            <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Lovely Financial Limited. All rights reserved.</p>
            <p className="text-sm text-slate-600">Regulated under Kenya's Data Protection Act, 2019.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
