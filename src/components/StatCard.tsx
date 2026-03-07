import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  change: string
}

export function StatCard({ label, value, icon: Icon, change }: StatCardProps) {
  //const isPositive = change.startsWith('+')

  return (
    <div className="bg-white border border-slate-200 p-6 space-y-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <h3 className="text-2xl font-bold text-slate-950 mt-1">{value}</h3>
        </div>
        <div className="text-slate-400">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Track divider */}
      <div className="h-px bg-slate-100"></div>

      {/* <div className="flex items-center gap-2">
        {isPositive ? (
          <ArrowUpRight className="w-4 h-4 text-slate-700" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-slate-500" />
        )}
        <p className="text-xs text-slate-600">{change}</p>
      </div> */}
    </div>
  )
}
