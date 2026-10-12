import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { CreditCard, CheckCircle2, AlertCircle, Receipt, Calendar, ShieldCheck } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export function FeeDashboard() {
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFee() {
      try {
        const res = await api.getStudentFees();
        setFeeData(res.feeAccount);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFee();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-sm text-cc-dark font-medium animate-pulse">Loading Fee Ledger...</div>;
  }

  const isPaid = feeData?.outstandingBalance === 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-cc-navy">Semester Fee Accounting &amp; Dues</h1>
        <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; Academic Finance Cell</p>
      </div>

      {/* Main Fee Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-cc-surface shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cc-muted">Total Semester Fee</span>
          <div className="text-2xl font-extrabold text-cc-navy font-mono mt-1">
            ₹{feeData?.totalSemesterFee?.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-cc-slate mt-1 block">Tuition &amp; Special Lab Fees</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-cc-surface shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Amount Paid</span>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
            ₹{feeData?.amountPaid?.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-emerald-600 mt-1 block">Recorded Receipts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-cc-surface shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cc-muted">Outstanding Balance</span>
          <div className={`text-2xl font-extrabold font-mono mt-1 ${isPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
            ₹{feeData?.outstandingBalance?.toLocaleString('en-IN')}
          </div>
          <div className="mt-1">
            {isPaid ? (
              <Badge type="fee-paid" label="Fully Paid" size="xs" />
            ) : (
              <Badge type="fee-overdue" label={`Due by ${feeData?.dueDate}`} size="xs" />
            )}
          </div>
        </div>
      </div>

      {/* Payment Receipts History */}
      <div className="bg-white rounded-2xl border border-cc-surface shadow-soft overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-cc-surface bg-cc-bg/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-cc-dark" />
            <h3 className="text-sm font-bold text-cc-navy">Authoritative Payment Receipts</h3>
          </div>
          <span className="text-xs text-cc-muted">College Finance Verification Ledger</span>
        </div>

        <div className="p-4">
          {(feeData?.history || []).length > 0 ? (
            <div className="space-y-3">
              {feeData.history.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-cc-bg/30 border border-cc-surface flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-50 text-cc-dark border border-teal-200">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-cc-navy font-mono">{item.receiptNumber}</h4>
                      <p className="text-[11px] text-cc-muted flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> Paid on {item.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-cc-navy font-mono">
                      ₹{item.amount?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold block">Cleared</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-cc-muted text-center py-6">No payment transactions recorded yet.</p>
          )}
        </div>

        <div className="p-4 bg-amber-50/50 border-t border-amber-200/50 text-xs text-amber-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Fee records are reconciled directly by the BVC Accounts Section. Real financial payment transactions are handled through authorized bank counters.
          </span>
        </div>
      </div>
    </div>
  );
}
