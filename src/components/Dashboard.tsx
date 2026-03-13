'use client'

import { PageHeader } from './PageHeader'
import { RecentUploads } from './RecentUploads'

export function Dashboard() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Overview of the Railji system"
      />
      {/* Main Content */}
      <div className="px-4 md:px-8 py-6 md:py-8 space-y-8 md:space-y-12">

        {/* Middle section - Timeline and Recent Activity */}
        {/* <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PaperTimeline />
          </div>

          <div className="lg:col-span-1">
            <ActiveUsers />
          </div>
        </section> */}

        {/* Recent Uploads */}
        <section>
          <RecentUploads />
        </section>
      </div>
    </div>
  )
}
