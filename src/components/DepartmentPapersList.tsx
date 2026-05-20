'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, Loader2, AlertCircle, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Pagination } from './ui/pagination'
import { API_ENDPOINTS } from '@/lib/api'
import { apiClient, getErrorMessage } from '@/lib/api-client'

interface Department {
  departmentId: string
  name: string
  description?: string
  hasAccess?: boolean
}

interface Paper {
  isFree: boolean
  _id: string
  paperId: string
  paperCode: string | null
  name: string
  description?: string
  departmentId: string
  year?: number
  paperType?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  hasAccess?: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface DepartmentPapersListProps {
  mode: 'manage' | 'access'
  userId?: string
  userDepartments?: string[]
  userPapers?: string[]
  onToggleDepartmentAccess?: (deptId: string, deptName: string, hasAccess: boolean) => Promise<void>
  onTogglePaperAccess?: (paperId: string, paperTitle: string, hasAccess: boolean) => Promise<void>
  onDeletePaper?: (paperId: string, deptId: string) => Promise<void>
  onTogglePaperStatus?: (paperId: string, deptId: string, currentStatus: boolean) => Promise<void>
  onViewPaper?: (paperId: string, departmentId: string) => void
}

export function DepartmentPapersList({
  mode,
  userId,
  userDepartments = [],
  userPapers = [],
  onToggleDepartmentAccess,
  onTogglePaperAccess,
  onDeletePaper,
  onTogglePaperStatus,
  onViewPaper,
}: DepartmentPapersListProps) {
  const [allDepartments, setAllDepartments] = useState<Department[]>([])
  const [papersByDept, setPapersByDept] = useState<Record<string, Paper[]>>({})
  const [paginationByDept, setPaginationByDept] = useState<Record<string, PaginationInfo>>({})
  const [currentPageByDept, setCurrentPageByDept] = useState<Record<string, number>>({})
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [loadingPapers, setLoadingPapers] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [togglingItem, setTogglingItem] = useState<string | null>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchDepartments()
    }
  }, [])

  const fetchDepartments = async () => {
    setLoadingDepts(true)
    setError(null)
    try {
      const url = mode === 'access' && userId
        ? API_ENDPOINTS.userDepartments(userId)
        : API_ENDPOINTS.departments
      const result = await apiClient.get(url)
      if (!result.success) throw new Error(getErrorMessage(result))
      const depts: Department[] = Array.isArray(result.data) ? result.data : []
      const generalDept: Department = {
        departmentId: 'GENERAL',
        name: 'General Papers',
        description: 'Common papers across all departments',
      }
      const allDepts = [generalDept, ...depts]
      setAllDepartments(allDepts)
      allDepts.forEach(dept => {
        if (dept.departmentId === 'GENERAL') fetchGeneralPapers(1)
        else fetchPapersForDept(dept.departmentId, 1)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load departments')
    } finally {
      setLoadingDepts(false)
    }
  }

  const fetchPapersForDept = async (deptId: string, page = 1) => {
    setLoadingPapers(prev => new Set(prev).add(deptId))
    try {
      const url = mode === 'access' && userId
        ? API_ENDPOINTS.userPapers(userId, deptId, page)
        : API_ENDPOINTS.papers(deptId, page)
      const result = await apiClient.get(url)
      if (!result.success) throw new Error(getErrorMessage(result))
      const papers: Paper[] = result.data?.papers ?? []
      const pagination: PaginationInfo | null = result.data?.pagination ?? null
      setPapersByDept(prev => ({ ...prev, [deptId]: papers }))
      if (pagination) setPaginationByDept(prev => ({ ...prev, [deptId]: pagination }))
      setCurrentPageByDept(prev => ({ ...prev, [deptId]: page }))
    } catch (err) {
      console.error(`Failed to load papers for ${deptId}:`, err)
      setPapersByDept(prev => ({ ...prev, [deptId]: [] }))
    } finally {
      setLoadingPapers(prev => { const n = new Set(prev); n.delete(deptId); return n })
    }
  }

  const fetchGeneralPapers = async (page = 1) => {
    const deptId = 'GENERAL'
    setLoadingPapers(prev => new Set(prev).add(deptId))
    try {
      const url = mode === 'access' && userId
        ? API_ENDPOINTS.userGeneralPapers(userId, page)
        : API_ENDPOINTS.generalPapers(page)
      const result = await apiClient.get(url)
      if (!result.success) throw new Error(getErrorMessage(result))
      const papers: Paper[] = result.data?.papers ?? []
      const pagination: PaginationInfo | null = result.data?.pagination ?? null
      setPapersByDept(prev => ({ ...prev, [deptId]: papers }))
      if (pagination) setPaginationByDept(prev => ({ ...prev, [deptId]: pagination }))
      setCurrentPageByDept(prev => ({ ...prev, [deptId]: page }))
    } catch (err) {
      console.error('Failed to load general papers:', err)
      setPapersByDept(prev => ({ ...prev, [deptId]: [] }))
    } finally {
      setLoadingPapers(prev => { const n = new Set(prev); n.delete(deptId); return n })
    }
  }

  const toggleDepartment = (deptId: string) => {
    const next = new Set(expandedDepts)
    if (next.has(deptId)) {
      next.delete(deptId)
    } else {
      next.add(deptId)
      if (!papersByDept[deptId]) {
        deptId === 'GENERAL' ? fetchGeneralPapers(1) : fetchPapersForDept(deptId, 1)
      }
    }
    setExpandedDepts(next)
  }

  const handleToggleDepartment = async (deptId: string, deptName: string, hasAccess: boolean) => {
    if (mode === 'access' && onToggleDepartmentAccess) {
      setTogglingItem(`dept-${deptId}`)
      await onToggleDepartmentAccess(deptId, deptName, hasAccess)
      setTogglingItem(null)
    }
  }

  const handleTogglePaper = async (
    paperId: string, paperTitle: string, deptId: string,
    hasAccess: boolean, currentStatus?: boolean,
  ) => {
    if (mode === 'access' && onTogglePaperAccess) {
      setTogglingItem(`paper-${paperId}`)
      await onTogglePaperAccess(paperId, paperTitle, hasAccess)
      setTogglingItem(null)
    } else if (mode === 'manage' && onTogglePaperStatus) {
      setTogglingItem(`paper-${paperId}`)
      await onTogglePaperStatus(paperId, deptId, currentStatus ?? true)
      setTogglingItem(null)
    }
  }

  const handlePageChange = (deptId: string, newPage: number) => {
    deptId === 'GENERAL' ? fetchGeneralPapers(newPage) : fetchPapersForDept(deptId, newPage)
  }

  /* ── Loading / Error states ── */
  if (loadingDepts) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-warm-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-5 flex items-start gap-3 border-red-200 bg-red-50">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-800">Error loading departments</p>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchDepartments} className="mt-2 text-red-600 hover:text-red-800 hover:bg-red-100 px-0">
            Try again
          </Button>
        </div>
      </div>
    )
  }

  const totalPapers = Object.values(paginationByDept).reduce((s, p) => s + p.total, 0)

  return (
    <div className="space-y-3">
      {/* Summary card (manage mode) */}
      {mode === 'manage' && (
        <div className="card px-6 py-4 flex items-center justify-between">
          <p className="text-sm font-medium text-warm-600">Total Papers</p>
          <span className="text-2xl font-bold text-rail-900">{totalPapers}</span>
        </div>
      )}

      {/* Department list */}
      {allDepartments.map(dept => {
        const isExpanded = expandedDepts.has(dept.departmentId)
        const papers = papersByDept[dept.departmentId] ?? []
        const isLoadingPapers = loadingPapers.has(dept.departmentId)
        const pagination = paginationByDept[dept.departmentId]
        const currentPage = currentPageByDept[dept.departmentId] ?? 1
        const hasAccess = mode === 'access' && (dept.hasAccess || userDepartments.includes(dept.departmentId))

        return (
          <div key={dept.departmentId} className="card overflow-hidden">
            {/* Department header */}
            <div className="flex items-center justify-between px-5 py-4 bg-warm-50 border-b border-warm-100 hover:bg-warm-100 transition-colors">
              <button
                onClick={() => toggleDepartment(dept.departmentId)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                {isExpanded
                  ? <ChevronDown className="w-4 h-4 text-warm-500 flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-warm-500 flex-shrink-0" />
                }
                <div>
                  <p className="font-semibold text-rail-900">{dept.name}</p>
                  {dept.description && (
                    <p className="text-xs text-warm-500 mt-0.5">{dept.description}</p>
                  )}
                </div>
              </button>

              <div className="flex items-center gap-3">
                <Badge variant="muted">
                  {isLoadingPapers
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : `${pagination?.total ?? papers.length} papers`
                  }
                </Badge>

                {mode === 'access' && onToggleDepartmentAccess && (
                  <button
                    onClick={e => { e.stopPropagation(); handleToggleDepartment(dept.departmentId, dept.name, hasAccess) }}
                    disabled={togglingItem === `dept-${dept.departmentId}`}
                    className={`p-1 transition-colors disabled:opacity-50 ${hasAccess ? 'text-emerald-500 hover:text-emerald-600' : 'text-warm-400 hover:text-warm-600'}`}
                    title={hasAccess ? 'Remove access' : 'Grant access'}
                  >
                    {togglingItem === `dept-${dept.departmentId}`
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : hasAccess ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Papers list */}
            {isExpanded && (
              <div>
                {isLoadingPapers ? (
                  <div className="py-10 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-warm-400" />
                  </div>
                ) : papers.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-warm-400">No papers in this department</p>
                ) : (
                  <>
                    <div className="divide-y divide-warm-100">
                      {papers.map(paper => {
                        const hasPaperAccess = mode === 'access' && (paper.hasAccess || userPapers.includes(paper.paperId))
                        const deptHasAccess = mode === 'access' && (dept.hasAccess || userDepartments.includes(dept.departmentId))
                        const isPaperToggleDisabled = mode === 'access' && (deptHasAccess || paper.isFree)

                        return (
                          <div key={paper._id} className="px-5 py-3.5 hover:bg-warm-50 transition-colors flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-rail-900 truncate">{paper.name}</p>
                                {paper.paperType && (
                                  <Badge variant="rail">{paper.paperType}</Badge>
                                )}
                                {paper.paperCode && (
                                  <Badge variant="default">{paper.paperCode}</Badge>
                                )}
                                {paper.isFree && (
                                  <Badge variant="free">Free</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-xs text-warm-400">
                                {paper.createdAt && <span>Created {new Date(paper.createdAt).toLocaleDateString()}</span>}
                                {paper.updatedAt && <span>Updated {new Date(paper.updatedAt).toLocaleDateString()}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {mode === 'manage' && (
                                <>
                                  {onViewPaper && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onViewPaper(paper.paperId, paper.departmentId)}
                                    >
                                      View
                                    </Button>
                                  )}
                                  {onTogglePaperStatus && (
                                    <button
                                      onClick={() => handleTogglePaper(paper.paperId, paper.name, dept.departmentId, false, paper.isActive)}
                                      disabled={togglingItem === `paper-${paper.paperId}`}
                                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${paper.isActive !== false ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50' : 'text-warm-400 hover:text-warm-600 hover:bg-warm-100'}`}
                                      title={paper.isActive !== false ? 'Deactivate' : 'Activate'}
                                    >
                                      {togglingItem === `paper-${paper.paperId}`
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : paper.isActive !== false
                                          ? <ToggleRight className="w-5 h-5" />
                                          : <ToggleLeft className="w-5 h-5" />
                                      }
                                    </button>
                                  )}
                                  {onDeletePaper && (
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => onDeletePaper(paper.paperId, dept.departmentId)}
                                      className="text-warm-400 hover:text-red-500 hover:bg-red-50"
                                      title="Delete paper"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              )}

                              {mode === 'access' && onTogglePaperAccess && (
                                <button
                                  onClick={() => !isPaperToggleDisabled && handleTogglePaper(paper.paperId, paper.name, dept.departmentId, hasPaperAccess)}
                                  disabled={togglingItem === `paper-${paper.paperId}` || isPaperToggleDisabled}
                                  className={`p-1.5 transition-colors disabled:opacity-40 ${isPaperToggleDisabled ? 'text-warm-300 cursor-not-allowed' : hasPaperAccess ? 'text-emerald-500 hover:text-emerald-600' : 'text-warm-400 hover:text-warm-600'}`}
                                  title={paper.isFree ? 'Free for all users' : deptHasAccess ? 'Department access overrides paper access' : hasPaperAccess ? 'Remove access' : 'Grant access'}
                                >
                                  {togglingItem === `paper-${paper.paperId}`
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : (hasPaperAccess || isPaperToggleDisabled)
                                      ? <ToggleRight className="w-5 h-5" />
                                      : <ToggleLeft className="w-5 h-5" />
                                  }
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                      <div className="px-5 py-3 border-t border-warm-100 bg-warm-50">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={pagination.totalPages}
                          total={pagination.total}
                          limit={pagination.limit}
                          onPageChange={(page) => handlePageChange(dept.departmentId, page)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      {allDepartments.length === 0 && (
        <div className="card py-12 text-center">
          <p className="text-warm-500">No departments found</p>
        </div>
      )}
    </div>
  )
}
