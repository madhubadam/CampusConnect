import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Megaphone, Calendar, User, Bell } from 'lucide-react';

export function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getStudentAnnouncements();
        setAnnouncements(res.announcements || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-sm text-cc-dark font-medium animate-pulse">Loading Department Announcements...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-cc-navy">Department Notices &amp; Circulars</h1>
        <p className="text-xs text-cc-muted">Bonam Venkata Chalamaya Engineering College &bull; CSE Department</p>
      </div>

      <div className="space-y-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="bg-white rounded-2xl p-6 border border-cc-surface shadow-soft">
            <div className="flex items-center justify-between text-xs text-cc-muted mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-cc-dark">
                <User className="w-3.5 h-3.5" /> {ann.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {ann.date}
              </span>
            </div>

            <h3 className="text-lg font-bold text-cc-navy">{ann.title}</h3>
            <p className="text-sm text-cc-slate mt-2 leading-relaxed">{ann.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
