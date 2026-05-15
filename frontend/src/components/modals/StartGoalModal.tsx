import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, CreditCard, Calendar, Activity } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGoal, requestGuardian } from "../../services/api";
import { toast } from "sonner";
import clsx from "clsx";

interface StartGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  { name: "Teal", value: "teal", tailwind: "bg-teal-500" },
  { name: "Indigo", value: "indigo", tailwind: "bg-indigo-500" },
  { name: "Rose", value: "rose", tailwind: "bg-rose-500" },
  { name: "Emerald", value: "emerald", tailwind: "bg-emerald-500" },
  { name: "Amber", value: "amber", tailwind: "bg-amber-500" },
  { name: "Violet", value: "violet", tailwind: "bg-violet-500" },
  { name: "Dark Cyan", value: "cyan", tailwind: "bg-cyan-600" },
];

export const StartGoalModal = ({ isOpen, onClose }: StartGoalModalProps) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"guardian" | "paybill">("guardian");
  
  // Form State
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [colorTheme, setColorTheme] = useState("teal");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");

  const goalMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(targetAmount);
      if (!goalName || !amount || !targetDate || !guardianName || !guardianPhone) {
        throw new Error("Please fill in all fields.");
      }
      // Basic date format check DD-MM-YYYY
      const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
      if (!dateRegex.test(targetDate)) {
        throw new Error("Date must be in DD-MM-YYYY format.");
      }

      await createGoal({
        name: goalName,
        target_amount: amount,
        target_date: targetDate,
        color_theme: colorTheme,
      });

      await requestGuardian({
        name: guardianName,
        phone_number: guardianPhone,
      });
    },
    onSuccess: () => {
      toast.success("Goal created! Guardian requested via WhatsApp.");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "guardian") {
      goalMutation.mutate();
    } else {
      toast.info("Preset Paybill mode coming soon!");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold">Start a Goal</h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 bg-slate-50 mx-6 mt-6 rounded-2xl">
              <button
                onClick={() => setActiveTab("guardian")}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all",
                  activeTab === "guardian" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <ShieldCheck className="w-4 h-4" /> Guardian Mode
              </button>
              <button
                onClick={() => setActiveTab("paybill")}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all",
                  activeTab === "paybill" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <CreditCard className="w-4 h-4" /> Preset Paybill
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === "guardian" ? (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Goal Details</h3>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Goal Name</label>
                        <input
                          type="text"
                          value={goalName}
                          onChange={(e) => setGoalName(e.target.value)}
                          placeholder="e.g., New Shoes"
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (KES)</label>
                          <input
                            type="number"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            placeholder="5000"
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Date
                          </label>
                          <input
                            type="text"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            placeholder="DD-MM-YYYY"
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Color Theme</label>
                        <div className="flex gap-2">
                          {COLORS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setColorTheme(c.value)}
                              className={clsx(
                                "w-8 h-8 rounded-full border-2 transition-all",
                                c.tailwind,
                                colorTheme === c.value ? "border-slate-900 scale-110 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                              )}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Guardian Details</h3>
                      <p className="text-sm text-slate-500 mb-2">They will receive a WhatsApp message to approve your withdrawals.</p>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Guardian Name</label>
                        <input
                          type="text"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          placeholder="e.g., Mom"
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">WhatsApp Number</label>
                        <input
                          type="tel"
                          value={guardianPhone}
                          onChange={(e) => setGuardianPhone(e.target.value)}
                          placeholder="2547XXXXXXXX"
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900">Preset Paybill Mode</h3>
                    <p className="text-slate-500 mt-2">Lock your savings to a specific paybill (e.g., KPLC, Water) to ensure funds are only used for that purpose.</p>
                    <div className="inline-block mt-4 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">Coming Soon</div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={goalMutation.isPending || activeTab === "paybill"}
                    className="w-full bg-primary hover:bg-teal-700 text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {goalMutation.isPending ? <Activity className="w-5 h-5 animate-spin" /> : activeTab === "guardian" ? "Request Guardian" : "Select Paybill"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
