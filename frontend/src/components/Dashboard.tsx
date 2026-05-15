import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ShieldCheck, Wallet, ArrowUpRight, ArrowDownLeft, Activity, Info, Clock, AlertCircle, X, Plus, Calendar as CalendarIcon, ChevronDown, Heart } from "lucide-react";
import { toast } from "sonner";
import { logOut } from "../services/firebase";
import { fetchBalance, initiateTopUp, requestWithdrawal, fetchGoals } from "../services/api";
import { StartGoalModal } from "./modals/StartGoalModal";
import clsx from "clsx";

interface PendingTransaction {
  transaction_id: string;
  amount: number;
  status: string;
  created_at: string;
  description?: string | null;
  type: string;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  target_date: string;
  color_theme: string;
  created_at: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

const THEME_BG: Record<string, string> = {
  teal: "bg-teal-600", indigo: "bg-indigo-600", rose: "bg-rose-600",
  emerald: "bg-emerald-600", amber: "bg-amber-600", violet: "bg-violet-600", cyan: "bg-cyan-700"
};

const THEME_TEXT: Record<string, string> = {
  teal: "text-teal-600", indigo: "text-indigo-600", rose: "text-rose-600",
  emerald: "text-emerald-600", amber: "text-amber-600", violet: "text-violet-600", cyan: "text-cyan-700"
};

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  
  const [verificationBannerDismissed, setVerificationBannerDismissed] = useState(false);
  const [isStartGoalOpen, setIsStartGoalOpen] = useState(false);
  const [isGoalDropdownOpen, setIsGoalDropdownOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [depositAmount, setDepositAmount] = useState<number | "">("");
  const [depositPhone, setDepositPhone] = useState("");
  
  const showVerificationBanner = user && !user.emailVerified && !verificationBannerDismissed && !user.email?.endsWith("@lovely.app");

  const { data: balanceData, isLoading: isBalanceLoading, isFetching: isBalanceFetching } = useQuery({
    queryKey: ["balance"],
    queryFn: fetchBalance,
    refetchInterval: 30000,
  });

  const { data: goalsData, isLoading: isGoalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals,
  });

  const topUpMutation = useMutation({
    mutationFn: ({ amount, phone }: { amount: number; phone: string }) => initiateTopUp(amount, phone),
    onSuccess: () => {
      toast.success("STK Push initiated! Please check your phone.");
      setDepositAmount("");
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason: string }) => requestWithdrawal(amount, reason),
    onSuccess: () => {
      toast.success("Withdrawal request sent to Guardian.");
      setWithdrawalAmount("");
      setRequestReason("");
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/auth?mode=signin");
    } catch {
      toast.error("Logout failed");
    }
  };

  const handleTopUp = () => {
    if (!depositPhone.trim() || !depositAmount || depositAmount <= 0) {
      toast.error("Enter a valid phone number and amount.");
      return;
    }
    topUpMutation.mutate({ amount: Number(depositAmount), phone: depositPhone });
  };

  const handleWithdraw = () => {
    const amount = Number(withdrawalAmount);
    if (!requestReason.trim() || !amount || amount <= 0) {
      toast.error("Enter a valid amount and reason.");
      return;
    }
    withdrawMutation.mutate({ amount, reason: requestReason });
  };

  const goals = (goalsData as Goal[]) || [];
  const selectedGoal = goals.find(g => g.id === selectedGoalId) || goals[0] || null;
  const activeColorTheme = selectedGoal?.color_theme || "teal";
  const bgClass = THEME_BG[activeColorTheme] || THEME_BG.teal;
  const textClass = THEME_TEXT[activeColorTheme] || THEME_TEXT.teal;

  const { real_balance = 0, pending_balance = 0, pending_transactions = [], withdrawal_locked = false } = balanceData || {};
  const totalBalance = Number(real_balance) + Number(pending_balance);
  const targetAmount = selectedGoal ? Number(selectedGoal.target_amount) : 5000;
  const progress = targetAmount > 0 ? Math.min(100, Math.round((totalBalance / targetAmount) * 100)) : 0;

  // Simple virtual pet health logic: happy if no pending withdrawals and progress > 0
  const hasPendingWithdrawals = (pending_transactions as PendingTransaction[]).some(tx => tx.type === 'withdrawal');
  const petMood = hasPendingWithdrawals ? "worried" : progress > 0 ? "happy" : "neutral";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary/20">
      <StartGoalModal isOpen={isStartGoalOpen} onClose={() => setIsStartGoalOpen(false)} />
      
      {/* Email Verification Banner */}
      <AnimatePresence>
        {showVerificationBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 border-b border-amber-200"
          >
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800 font-medium flex-1">
                Your email is not verified. Check your inbox for a verification link to unlock all features.
              </p>
              <button
                onClick={() => setVerificationBannerDismissed(true)}
                className="text-amber-600 hover:text-amber-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={clsx("p-1.5 rounded-lg text-white transition-colors", bgClass)}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Lovely</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-slate-500 hidden sm:block">
                {user.email?.endsWith("@lovely.app")
                  ? `📱 ${user.email.replace("@lovely.app", "")}`
                  : user.email}
              </span>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Top Section */}
        <section className="grid lg:grid-cols-[1fr_400px] gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center justify-between relative">
              <div>
                <p className={clsx("text-sm font-semibold uppercase tracking-wider flex items-center gap-2", textClass)}>
                  Overview
                  {(isBalanceLoading || isBalanceFetching || isGoalsLoading) && (
                    <Activity className="w-4 h-4 animate-spin opacity-70" />
                  )}
                </p>
                <button 
                  onClick={() => setIsStartGoalOpen(true)}
                  className="mt-2 flex items-center gap-2 text-3xl font-semibold hover:opacity-80 transition-opacity"
                >
                  <Plus className={clsx("w-8 h-8", textClass)} />
                  Start Goal
                </button>
              </div>

              {/* Goals Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsGoalDropdownOpen(!isGoalDropdownOpen)}
                  className={clsx("px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors border shadow-sm", bgClass, "text-white hover:opacity-90")}
                >
                  <CalendarIcon className="w-4 h-4" /> 
                  {selectedGoal ? selectedGoal.name : "My Goals"}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                
                <AnimatePresence>
                  {isGoalDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-30"
                    >
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">Goals Calendar</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {goals.length === 0 ? (
                          <p className="text-center text-sm text-slate-500 py-6">No goals found.</p>
                        ) : (
                          goals.map(g => (
                            <button
                              key={g.id}
                              onClick={() => {
                                setSelectedGoalId(g.id);
                                setIsGoalDropdownOpen(false);
                              }}
                              className={clsx(
                                "w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex flex-col gap-1",
                                selectedGoalId === g.id && "bg-slate-50"
                              )}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-900">{g.name}</span>
                                <div className={clsx("w-3 h-3 rounded-full", THEME_BG[g.color_theme] || THEME_BG.teal)} />
                              </div>
                              <span className="text-xs text-slate-500">{g.target_date}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Target / Progress Card with Pet */}
              <div className={clsx("rounded-3xl p-8 shadow-soft text-white relative overflow-hidden transition-colors duration-500", bgClass)}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-sm font-medium text-white/80">{selectedGoal ? selectedGoal.name : "Savings Target"}</p>
                    <p className="text-4xl lg:text-5xl font-semibold mt-2 tracking-tight">{formatCurrency(targetAmount)}</p>
                  </div>
                  {/* Virtual Pet */}
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm flex flex-col items-center justify-center shadow-inner">
                    <span className="text-3xl" title={`Pet is ${petMood}`}>
                      {petMood === "happy" ? "🐶" : petMood === "worried" ? "😿" : "🐱"}
                    </span>
                    <div className="flex gap-1 mt-1">
                      <Heart className={clsx("w-3 h-3", petMood === "happy" ? "text-red-400 fill-red-400" : "text-white/50")} />
                      <Heart className={clsx("w-3 h-3", petMood === "happy" ? "text-red-400 fill-red-400" : "text-white/50")} />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 space-y-2 relative z-10">
                  <div className="flex justify-between text-sm font-medium text-white/90">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${progress}%` }} 
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                  {selectedGoal && (
                    <p className="text-xs text-white/80 mt-2 text-right">Target Date: {selectedGoal.target_date}</p>
                  )}
                </div>
              </div>

              {/* Available Balance & Deposit Card */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 relative overflow-hidden group flex flex-col">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Wallet className="w-24 h-24" />
                </div>
                <p className="text-sm font-medium text-slate-500 relative z-10">Available Balance</p>
                <p className="text-4xl lg:text-5xl font-semibold mt-2 tracking-tight relative z-10">{formatCurrency(Number(real_balance))}</p>
                {Number(pending_balance) > 0 && (
                  <div className="mt-2 inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium relative z-10 self-start">
                    <Clock className="w-4 h-4" />
                    +{formatCurrency(Number(pending_balance))} pending
                  </div>
                )}

                <div className="mt-auto pt-6 border-t border-slate-100 relative z-10 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <ArrowDownLeft className="w-4 h-4" /> Quick Deposit
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value ? Number(e.target.value) : "")}
                      placeholder="Amount"
                      className="w-1/3 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                    <input
                      type="tel"
                      value={depositPhone}
                      onChange={(e) => setDepositPhone(e.target.value)}
                      placeholder="Phone (2547...)"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    />
                  </div>
                  <button
                    onClick={handleTopUp}
                    disabled={topUpMutation.isPending}
                    className={clsx("w-full text-white font-medium py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2 text-sm", bgClass)}
                  >
                    {topUpMutation.isPending ? <Activity className="w-4 h-4 animate-spin" /> : "Initiate STK Push"}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>

          {/* Pending Approvals */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-400" /> Recent Activity
              </h3>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              <AnimatePresence>
                {pending_transactions.length === 0 ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-500 text-sm text-center py-8">No pending activity.</motion.p>
                ) : (
                  pending_transactions.map((tx: PendingTransaction) => (
                    <motion.div 
                      key={tx.transaction_id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4"
                    >
                      <div className={clsx(
                        "p-2 rounded-xl text-white", 
                        tx.type === "deposit" ? bgClass : "bg-rose-500"
                      )}>
                        {tx.type === "deposit" ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {tx.type === "deposit" ? "Deposit Processing" : "Withdrawal Pending"}
                        </p>
                        <p className="text-lg font-bold mt-0.5">{formatCurrency(tx.amount)}</p>
                        <p className="text-xs text-slate-500 mt-1 capitalize flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {tx.status.replace("_", " ")}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {/* Action Section */}
        <section className="grid md:grid-cols-2 gap-8">
          {/* Withdraw Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl"><ArrowUpRight className="w-6 h-6" /></div>
              <div>
                <h3 className="text-xl font-semibold">Request Withdrawal</h3>
                <p className="text-sm text-slate-500">Requires Guardian approval</p>
              </div>
            </div>

            {withdrawal_locked ? (
              <div className="bg-amber-50 text-amber-800 p-6 rounded-2xl flex items-start gap-4">
                <Info className="w-6 h-6 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Withdrawals Locked</h4>
                  <p className="text-sm mt-1 opacity-90">You have pending funds clearing. Please wait until Safaricom confirms your recent deposits before requesting a withdrawal.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (KES)</label>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for Guardian</label>
                  <textarea
                    rows={3}
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Why do you need to withdraw?"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                  />
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawMutation.isPending}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {withdrawMutation.isPending ? <Activity className="w-5 h-5 animate-spin" /> : "Request via WhatsApp"}
                </button>
              </div>
            )}
          </motion.div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
