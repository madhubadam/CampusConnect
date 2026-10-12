import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { HeartHandshake, Calendar, User, Clock, CheckCircle2 } from 'lucide-react';

export function InterventionTracking() {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getInterventions();
        setInterventions(res.interventions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-sm text-cc-dark font-medium animate-pulse">Loading Academic Interventions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-cc-navy">Academic Support &amp; Mentoring Logs</h1>
        <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; Student Welfare Cell</p>
      </div>

      <div className="bg-white rounded-2xl border border-cc-surface shadow-soft overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-cc-surface bg-cc-bg/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-cc-dark" />
            <h3 className="text-sm font-bold text-cc-navy">Recorded Interventions ({interventions.length})</h3>
          </div>
          <span className="text-xs text-cc-muted">Faculty Mentoring Records</span>
        </div>

        <div className="divide-y divide-cc-surface/60">
          {interventions.length > 0 ? (
            interventions.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 hover:bg-cc-bg/20 transition space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-cc-navy bg-cc-surface px-2 py-0.5 rounded">
                      {item.studentId}
                    </span>
                    <h4 className="text-sm font-bold text-cc-navy">{item.studentName}</h4>
                    <span className="text-xs text-cc-muted">&bull; {item.section}</span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-cc-dark border border-teal-200">
                    {item.supportType?.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-cc-slate leading-relaxed">{item.notes}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-cc-muted pt-1">
                  <span>Mentor: <strong className="text-cc-navy">{item.facultyName}</strong></span>
                  <span>Follow-Up Date: <strong className="text-cc-navy">{item.followUpDate}</strong></span>
                  <span>Status: <strong className="text-emerald-700">{item.status}</strong></span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-cc-muted text-center py-10">No mentoring interventions recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
