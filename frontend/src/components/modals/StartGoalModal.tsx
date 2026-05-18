import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, CreditCard, Calendar, Activity, Phone } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGoal, requestGuardian } from "../../services/api";
import { toast } from "sonner";
import clsx from "clsx";

interface StartGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  { name: "Teal",     value: "teal",    bg: "#14b8a6" },
  { name: "Indigo",   value: "indigo",  bg: "#6366f1" },
  { name: "Rose",     value: "rose",    bg: "#f43f5e" },
  { name: "Emerald",  value: "emerald", bg: "#10b981" },
  { name: "Amber",    value: "amber",   bg: "#f59e0b" },
  { name: "Violet",   value: "violet",  bg: "#8b5cf6" },
  { name: "Cyan",     value: "cyan",    bg: "#0891b2" },
];

// ---------------------------------------------------------------------------
// Phone normalisation — accepts 07…, 01…, 7…, 254…, +254…
// Returns 254XXXXXXXXX or throws a descriptive error.
// ---------------------------------------------------------------------------
function normalisePhone(raw: string): string {
  const clean = raw.replace(/\D/g, ""); // digits only

  let formatted = clean;
  if (clean.startsWith("0"))       formatted = "254" + clean.slice(1);
  else if (clean.startsWith("254")) formatted = clean;
  else if (clean.startsWith("7") || clean.startsWith("1")) formatted = "254" + clean;

  if (formatted.length !== 12) {
    throw new Error(
      `Phone number must be 12 digits (254XXXXXXXXX) — got ${formatted.length}. ` +
      "Accepted formats: 07…, 01…, +254…, 254…"
    );
  }
  return formatted;
}

// ---------------------------------------------------------------------------
// Phone input with live format hint
// ---------------------------------------------------------------------------
function PhoneInput({
  value,
  onChange,
  placeholder = "07XXXXXXXX or +254XXXXXXXXX",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const hint = useMemo(() => {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("0") && digits.length === 10) return "✓ Kenyan format";
    if (digits.startsWith("254") && digits.length === 12) return "✓ International format";
    if (digits.startsWith("7") && digits.length === 9) return "✓ Short format";
    if (digits.length < 9) return "Keep typing…";
    return "⚠ Check number — expected 10 digits (07…) or 12 digits (254…)";
  }, [value]);

  const hintColor =
    hint?.startsWith("✓") ? "text-emerald-600" :
    hint?.startsWith("⚠") ? "text-rose-500" :
    "text-slate-400";

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
        <Phone className="w-3.5 h-3.5" /> Phone Number
      </label>
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
      {hint && <p className={`text-xs mt-1 ml-1 ${hintColor}`}>{hint}</p>}
    </div>
  );
}

// Native Date Picker will be used directly below

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
export const StartGoalModal = ({ isOpen, onClose }: StartGoalModalProps) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"guardian" | "paybill">("guardian");

  // Goal fields
  const [goalName, setGoalName]       = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [colorTheme, setColorTheme]   = useState("teal");

  // Target Date
  const [targetDate, setTargetDate] = useState("");

  // Guardian fields
  const [guardianName, setGuardianName]   = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");

  const goalMutation = useMutation({
    mutationFn: async () => {
      // Validate goal fields
      const amount = Number(targetAmount);
      if (!goalName.trim()) throw new Error("Please enter a goal name.");
      if (!amount || amount <= 0) throw new Error("Please enter a valid amount.");
      if (!targetDate) throw new Error("Please select a target date.");

      // Validate guardian fields
      if (!guardianName.trim()) throw new Error("Please enter the guardian's name.");
      if (!guardianPhone.trim()) throw new Error("Please enter the guardian's phone number.");

      // Normalise phone — throws descriptive error on bad format
      const normalisedPhone = normalisePhone(guardianPhone);

      // input type="date" gives YYYY-MM-DD. Convert to DD-MM-YYYY for backend.
      const [y, m, d] = targetDate.split("-");
      const formattedDate = `${d}-${m}-${y}`;

      await createGoal({
        name: goalName.trim(),
        target_amount: amount,
        target_date: formattedDate,
        color_theme: colorTheme,
      });

      await requestGuardian({
        name: guardianName.trim(),
        phone_number: normalisedPhone,
      });
    },
    onSuccess: () => {
      toast.success("Goal created and guardian saved!");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      // Reset form
      setGoalName(""); setTargetAmount(""); setColorTheme("teal");
      setTargetDate("");
      setGuardianName(""); setGuardianPhone("");
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
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
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 bg-slate-50 mx-6 mt-6 rounded-2xl">
              <button
                onClick={() => setActiveTab("guardian")}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all",
                  activeTab === "guardian"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <ShieldCheck className="w-4 h-4" /> Guardian Mode
              </button>
              <button
                onClick={() => setActiveTab("paybill")}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all",
                  activeTab === "paybill"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
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
                    {/* ── Goal Details ── */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Goal Details
                      </h3>

                      {/* Goal Name */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Goal Name
                        </label>
                        <input
                          type="text"
                          value={goalName}
                          onChange={(e) => setGoalName(e.target.value)}
                          placeholder="e.g., New Shoes"
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Target Amount (KES)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="150000"
                          value={targetAmount}
                          onChange={(e) => setTargetAmount(e.target.value)}
                          placeholder="e.g., 5000"
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      {/* Target Date */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Target Date
                        </label>
                        <input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                        />
                      </div>

                      {/* Color theme */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Color Theme
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {COLORS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setColorTheme(c.value)}
                              style={{ backgroundColor: c.bg }}
                              className={clsx(
                                "w-8 h-8 rounded-full border-2 transition-all",
                                colorTheme === c.value
                                  ? "border-slate-900 scale-110 shadow-md"
                                  : "border-transparent opacity-60 hover:opacity-100"
                              )}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* ── Guardian Details ── */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Guardian Details
                      </h3>
                      <p className="text-sm text-slate-500">
                        Your guardian will need to approve withdrawal requests.
                      </p>

                      {/* Guardian Name */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Guardian Name
                        </label>
                        <input
                          type="text"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          placeholder="e.g., Mom"
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      {/* Phone with live hint */}
                      <PhoneInput value={guardianPhone} onChange={setGuardianPhone} />
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900">Preset Paybill Mode</h3>
                    <p className="text-slate-500 mt-2">
                      Lock your savings to a specific paybill (e.g., KPLC, Water) to ensure
                      funds are only used for that purpose.
                    </p>
                    <div className="inline-block mt-4 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                      Coming Soon
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={goalMutation.isPending || activeTab === "paybill"}
                    className="w-full bg-primary hover:bg-teal-700 text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {goalMutation.isPending ? (
                      <Activity className="w-5 h-5 animate-spin" />
                    ) : activeTab === "guardian" ? (
                      "Save Goal & Guardian"
                    ) : (
                      "Select Paybill"
                    )}
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
