'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from './PageHeader'
import { UsersAPI, User as UserType } from '@/lib/users-api'
import { DepartmentPapersList } from './DepartmentPapersList'

interface UserAccessManagementProps {
  userId: string
}

export function UserAccessManagement({ userId }: UserAccessManagementProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => { fetchUserData() }, [userId])

  const fetchUserData = async () => {
    try {
      const data = await UsersAPI.getUserById(userId)
      if (data.success) {
        setUser(data.data.user)
      } else {
        toast.error('User not found')
        router.push('/users')
      }
    } catch {
      toast.error('Failed to load user data')
      router.push('/users')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDepartmentAccess = async (deptId: string, deptName: string, hasAccess: boolean) => {
    if (!user?.userId) return
    try {
      const data = await UsersAPI.updateUserAccess(user.userId, {
        type: 'department', resourceId: deptId, action: hasAccess ? 'remove' : 'add',
      })
      if (data.success) {
        toast.success(data.message || `Access updated for ${deptName}`)
        await fetchUserData()
        setRefreshKey(k => k + 1)
      } else {
        toast.error(data.message || 'Failed to update department access')
      }
    } catch {
      toast.error('Error updating department access')
    }
  }

  const handleTogglePaperAccess = async (paperId: string, paperTitle: string, hasAccess: boolean) => {
    if (!user?.userId) return
    try {
      const data = await UsersAPI.updateUserAccess(user.userId, {
        type: 'paper', resourceId: paperId, action: hasAccess ? 'remove' : 'add',
      })
      if (data.success) {
        toast.success(data.message || `Access updated for "${paperTitle}"`)
        await fetchUserData()
        setRefreshKey(k => k + 1)
      } else {
        toast.error(data.message || 'Failed to update paper access')
      }
    } catch {
      toast.error('Error updating paper access')
    }
  }

  if (loading) {
    return (
      <div className="bg-warm-50 min-h-screen">
        <PageHeader title="User Access" subtitle="Loading…" />
        <div className="py-16 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-warm-400" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-warm-50 min-h-screen">
        <PageHeader title="User Access" subtitle="User not found" />
      </div>
    )
  }

  return (
    <div className="bg-warm-50 min-h-screen">
      <PageHeader
        title="Manage Access"
        subtitle={
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push('/users')}
              className="flex items-center gap-1.5 text-sm text-warm-500 hover:text-rail-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Users
            </button>
            <span className="text-warm-300">·</span>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-rail-100 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-rail-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rail-900 leading-none">{user.username}</p>
                <p className="text-xs text-warm-400 mt-0.5">{user.email}</p>
              </div>
            </div>
          </div>
        }
        action={{
          label: 'Refresh',
          onClick: () => window.location.reload(),
          icon: RefreshCw,
        }}
      />

      <div className="px-4 md:px-8 py-6">
        <DepartmentPapersList
          key={refreshKey}
          mode="access"
          userId={user.userId}
          onToggleDepartmentAccess={handleToggleDepartmentAccess}
          onTogglePaperAccess={handleTogglePaperAccess}
        />
      </div>
    </div>
  )
}
