'use client'

import { TrendingUp, Users as UsersIcon, FileCheck } from 'lucide-react'
import { PageHeader } from './PageHeader'
import { StatCard } from './StatCard'
import { RecentUploads } from './RecentUploads'
import { ActiveUsers } from './ActiveUsers'
import { PaperTimeline } from './PaperTimeline'

export function Dashboard() {
  const stats = [
    {
      label: 'Active Papers',
      value: '24',
      icon: FileCheck,
      change: '+2 this week',
    },
    {
      label: 'Total Users',
      value: '1,847',
      icon: UsersIcon,
      change: '+142 this month',
    },
  /*{
      label: 'Papers Uploaded',
      value: '342',
      icon: TrendingUp,
      change: '+58 this month',
    },*/
  ]

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Overview of the Railji system"
      />

      {/* Main Content */}
      <div className="px-4 md:px-8 py-6 md:py-8 space-y-8 md:space-y-12">
        {/* Stats Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </section>

        {/* Middle section - Timeline and Recent Activity */}
        {/* <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PaperTimeline />
          </div>

          <div className="lg:col-span-1">
            <ActiveUsers />
          </div>
        </section> */}

        {/* Track divider */}
        <div className="track"></div>

        {/* Recent Uploads */}
        <section>
          <RecentUploads />
        </section>
      </div>
    </div>
  )
}
