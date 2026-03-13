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

interface UserUploadCount {
  username: string | null
  count: number
}

interface ApiResponse {
  recentActivity: Activity[]
  paperUploadCount: Record<string, number>
  totalPapers: number
  totalUsers: number
}

interface RecentUploadsProps {
  activities?: Activity[]
}

type DateFilter = 'week' | 'month' | 'year';

export function RecentUploads(props: RecentUploadsProps) {
  const [activities, setActivities] = useState<Activity[]>(props.activities || []);
  const [userCounts, setUserCounts] = useState<UserUploadCount[]>([]);
  const [totalPapers, setTotalPapers] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(!props.activities);
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');

  const getDateRange = (filter: DateFilter): { startDate: string; endDate: string } => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate: Date;

    switch (filter) {
      case 'week':
        // Start of current week (Monday)
        startDate = new Date(now);
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        break;
      case 'month':
        // Start of current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        // Start of current year
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate
    };
  };

  useEffect(() => {
    if (props.activities) return;
    
    const fetchActivities = async () => {
      try {
        const { startDate, endDate } = getDateRange(dateFilter);
        const url = `${API_ENDPOINTS.paperLogs}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        const response = await fetch(url);
        const result = await response.json();
        if (result.success && result.data) {
          const { recentActivity, paperUploadCount, totalPapers, totalUsers } = result.data as ApiResponse;
          setActivities(recentActivity || []);
          
          // Convert paperUploadCount object to array
          const countsArray: UserUploadCount[] = Object.entries(paperUploadCount || {}).map(([username, count]) => ({
            username: username === 'null' ? null : username,
            count
          })).sort((a, b) => b.count - a.count);
          
          setUserCounts(countsArray);
          setTotalPapers(totalPapers || 0);
          setTotalUsers(totalUsers || 0);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [props.activities, dateFilter]);

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setDateFilter('week')}
          className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
            dateFilter === 'week'
              ? 'bg-slate-950 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setDateFilter('month')}
          className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
            dateFilter === 'month'
              ? 'bg-slate-950 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setDateFilter('year')}
          className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
            dateFilter === 'year'
              ? 'bg-slate-950 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          This Year
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 px-6 py-4">
          <div className="text-sm text-slate-600">Total Papers</div>
          <div className="text-2xl font-semibold text-slate-950 mt-1">{totalPapers}</div>
        </div>
        <div className="bg-white border border-slate-200 px-6 py-4">
          <div className="text-sm text-slate-600">Total Users</div>
          <div className="text-2xl font-semibold text-slate-950 mt-1">{totalUsers}</div>
        </div>
      </div>

      {/* User Upload Counts Section */}
      <div className="bg-white border border-slate-200">
        <div className="px-6 py-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-950">Top Contributors</h2>
          <p className="text-sm text-slate-600 mt-1">
            Papers uploaded by user
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="table-minimal">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left text-sm font-semibold text-slate-950 px-6 py-3">User</th>
                <th className="text-right text-sm font-semibold text-slate-950 px-6 py-3">Papers</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2} className="text-slate-600 text-center py-4">Loading...</td>
                </tr>
              ) : userCounts.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-slate-600 text-center py-4">No upload data</td>
                </tr>
              ) : (
                userCounts.map((user, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-950 font-medium">
                      {String(user.username) === 'null' || user.username === null ? 'Anonymous' : user.username}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-950 font-semibold text-sm">
                        {user.count}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white border border-slate-200">
        <div className="px-6 py-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-950">Recent Activity</h2>
          <p className="text-sm text-slate-600 mt-1">
            Latest paper uploads and edits
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
                      <span className="font-medium text-slate-950">{act.username}</span>
                      {' '}{act.message.split(act.username).pop()}
                    </td>
                    <td className="text-slate-500 text-sm text-right">
                      {formatDateTime(act.createdAt)}
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
    </div>
  );
}
