import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ShieldCheck, Wallet, ArrowUpRight, ArrowDownLeft, Activity, Info, Clock, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { logOut } from "../services/firebase";
import { fetchBalance, initiateTopUp, requestWithdrawal } from "../services/api";
import clsx from "clsx";

interface PendingTransaction {
  transaction_id: string;
  amount: number;
  status: string;
  created_at: string;
  description?: string | null;
  type: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [verificationBannerDismissed, setVerificationBannerDismissed] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [depositAmount, setDepositAmount] = useState<number | "">("");
  const [depositPhone, setDepositPhone] = useState("");
  const showVerificationBanner = user && !user.emailVerified && !verificationBannerDismissed && !user.email?.endsWith("@lovely.app");

  const { data: balanceData, isLoading, isFetching } = useQuery({
    queryKey: ["balance"],
    queryFn: fetchBalance,
    refetchInterval: 30000,
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

  const { real_balance = 0, pending_balance = 0, pending_transactions = [], savings_target = 5000, withdrawal_locked = false } = balanceData || {};
  const totalBalance = Number(real_balance) + Number(pending_balance);
  const progress = Math.min(100, Math.round((totalBalance / Number(savings_target)) * 100));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary/20">
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                  Overview
                  {(isLoading || isFetching) && (
                    <Activity className="w-4 h-4 animate-spin text-primary opacity-70" />
                  )}
                </p>
                <h2 className="text-3xl font-semibold mt-1">Your Savings Goal</h2>
              </div>
              <div className="bg-danger/10 text-danger px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Guardian Mode Active
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Balance Card */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Wallet className="w-24 h-24" />
                </div>
                <p className="text-sm font-medium text-slate-500">Available Balance</p>
                <p className="text-5xl font-semibold mt-2 tracking-tight">{formatCurrency(Number(real_balance))}</p>
                {Number(pending_balance) > 0 && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    +{formatCurrency(Number(pending_balance))} pending
                  </div>
                )}
              </div>

              {/* Progress Card */}
              <div className="bg-gradient-to-br from-primary to-teal-800 rounded-3xl p-8 shadow-soft text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <p className="text-sm font-medium text-teal-100">Savings Target</p>
                <p className="text-5xl font-semibold mt-2 tracking-tight">{formatCurrency(Number(savings_target))}</p>
                
                <div className="mt-8 space-y-2 relative z-10">
                  <div className="flex justify-between text-sm font-medium text-teal-100">
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
                        "p-2 rounded-xl", 
                        tx.type === "deposit" ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"
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
          {/* Deposit Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-surface2 text-primary rounded-2xl"><ArrowDownLeft className="w-6 h-6" /></div>
              <div>
                <h3 className="text-xl font-semibold">Deposit Funds</h3>
                <p className="text-sm text-slate-500">Add to your savings via M-Pesa</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (KES)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={depositPhone}
                  onChange={(e) => setDepositPhone(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <button
                onClick={handleTopUp}
                disabled={topUpMutation.isPending}
                className="w-full bg-primary hover:bg-teal-700 text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {topUpMutation.isPending ? <Activity className="w-5 h-5 animate-spin" /> : "Initiate STK Push"}
              </button>
            </div>
          </motion.div>

          {/* Withdraw Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-danger/10 text-danger rounded-2xl"><ArrowUpRight className="w-6 h-6" /></div>
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
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for Guardian</label>
                  <textarea
                    rows={3}
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Why do you need to withdraw?"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger transition-all resize-none"
                  />
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawMutation.isPending}
                  className="w-full bg-danger hover:bg-red-700 text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
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
