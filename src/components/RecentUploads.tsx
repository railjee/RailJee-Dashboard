'use client';

import { API_ENDPOINTS } from '@/lib/api';
import { useEffect, useState } from 'react';

interface Activity {
  _id: string
  username: string
  action: string
  paperId: string
  message: string
  createdAt: string
  updatedAt: string
  __v: number
}

interface RecentUploadsProps {
  activities?: Activity[]
}

export function RecentUploads(props: RecentUploadsProps) {
  const [activities, setActivities] = useState<Activity[]>(props.activities || []);
  const [loading, setLoading] = useState(!props.activities);

  useEffect(() => {
    if (props.activities) return; // use provided activities if available
    
    const fetchActivities = async () => {
      try {
        const response = await fetch(
          API_ENDPOINTS.paperLogs
        );
        const result = await response.json();
        if (result.success && result.data) {
          setActivities(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [props.activities]);

  return (
    <div className="bg-white border border-slate-200">
      <div className="px-6 py-6 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-950">Activity History</h2>
        <p className="text-sm text-slate-600 mt-1">
          Recent paper uploads and edits
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="table-minimal">
          <tbody>
            {loading ? (
              <tr>
                <td className="text-slate-600 text-center py-4">Loading activities...</td>
              </tr>
            ) : activities.length === 0 ? (
              <tr>
                <td className="text-slate-600 text-center py-4">No activities yet</td>
              </tr>
            ) : (
              activities.map((act) => (
                <tr key={act._id}>
                  <td className="text-slate-600">
                    {(() => {
                      const d = new Date(act.createdAt)
                      const day = String(d.getDate()).padStart(2, '0')
                      const month = String(d.getMonth() + 1).padStart(2, '0')
                      const year = d.getFullYear()
                      let hours = d.getHours()
                      const minutes = String(d.getMinutes()).padStart(2, '0')
                      const ampm = hours >= 12 ? 'PM' : 'AM'
                      hours = hours % 12
                      hours = hours ? hours : 12
                      const hoursStr = String(hours).padStart(2, '0')
                      return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`
                    })()} - {act.message}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-100">
        <a
          href="/upload"
          className="text-sm font-medium text-slate-700 hover:text-slate-950 inline-flex items-center gap-2 transition-colors"
        >
          Upload new paper
          <span className="text-slate-400">→</span>
        </a>
      </div>
    </div>
  );
}
