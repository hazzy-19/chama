import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logOut } from "../services/firebase";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const Dashboard = () => {
  const navigate = useNavigate();
  const [requestReason, setRequestReason] = useState("");
  const [requestStatus, setRequestStatus] = useState<"none" | "pending" | "approved" | "declined">("none");
  const [message, setMessage] = useState("No withdrawal requests at the moment.");

  const handleRequest = () => {
    if (!requestReason.trim()) {
      setMessage("Please provide a reason before sending the request.");
      return;
    }

    setRequestStatus("pending");
    setMessage("Request sent to guardian through WhatsApp. Waiting for approval.");
  };

  const handleDecision = (approved: boolean) => {
    setRequestStatus(approved ? "approved" : "declined");
    setMessage(
      approved
        ? "Guardian approved the withdrawal. The request will be finalized via WhatsApp."
        : "Guardian declined the request. Your savings remain protected."
    );
  };

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <Card className="bg-white">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-red-700">Account overview</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">Savings dashboard</h2>
              </div>
              <div className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                Guardian mode
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/80 bg-surface2 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-muted">Current balance</p>
                <p className="mt-4 text-4xl font-semibold text-slate-950">0 shillings</p>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-surface2 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-muted">Savings target</p>
                <p className="mt-4 text-4xl font-semibold text-slate-950">5,000</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/80 bg-surface2 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-muted">Guardian</p>
                <p className="mt-4 text-xl font-semibold text-slate-950">Mama Amina</p>
                <p className="mt-2 text-sm text-slate-600">Approves withdrawals and protects your goal.</p>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-surface2 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-muted">Due date</p>
                <p className="mt-4 text-xl font-semibold text-slate-950">14 days left</p>
                <p className="mt-2 text-sm text-slate-600">Withdrawals require guardian consent before due date.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-red-600 text-white">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.24em] text-red-100">Guardian alert</p>
            <h3 className="text-2xl font-semibold">Approval workflow</h3>
            <p className="text-sm leading-7 text-red-100">
              All withdrawal requests go through WhatsApp to the guardian. They choose yes or no at the bottom of the request.
            </p>
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-sm text-white/90">Pending requests are visible instantly and protected by guardian decisions.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-white">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-red-700">Balance Summary</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">Savings overview</h3>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-surface2 p-6">
            <p className="text-sm text-slate-600">
              Your account stays focused on savings and guardian approval. Deposits and withdrawals are handled securely through M-Pesa, without extra transaction logging.
            </p>
          </div>
        </div>
      </Card>

      <Card className="bg-white">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-red-700">Withdrawal request</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">Send a guardian request</h3>
            </div>
            <div className="space-y-4">
              <textarea
                rows={4}
                value={requestReason}
                onChange={(event) => setRequestReason(event.target.value)}
                placeholder="Reason for withdrawal, amount required, and urgency"
                className="w-full rounded-3xl border border-slate-200 bg-surface px-4 py-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Button variant="default" onClick={handleRequest} className="w-full sm:w-auto">
                Send request via WhatsApp
              </Button>
              <p className="text-sm text-slate-600">Request status: <span className="font-semibold text-slate-900">{requestStatus}</span></p>
              <p className="text-sm text-slate-600">{message}</p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-surface2 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-muted">Guardian decisions</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Approve or decline</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">Your guardian will see this request in WhatsApp and respond below.</p>
            <div className="mt-6 grid gap-3">
              <Button variant="default" onClick={() => handleDecision(true)}>
                Yes, approve withdrawal
              </Button>
              <Button variant="destructive" onClick={() => handleDecision(false)}>
                No, decline request
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white py-6 px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-red-700">Platform trust</p>
            <p className="mt-2 max-w-2xl text-base text-slate-600">
              The system is designed for saving discipline: you set a goal, assign a guardian, and the guardian confirms withdrawals through WhatsApp.
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default Dashboard;
