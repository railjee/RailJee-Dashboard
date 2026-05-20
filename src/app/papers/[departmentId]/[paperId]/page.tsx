'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { PaperJsonEditor, Question } from '@/components/PaperJsonEditor'
import { PaperDetailsForm } from '@/components/PaperDetailsForm'
import { API_ENDPOINTS } from '@/lib/api'
import { apiClient, getErrorMessage } from '@/lib/api-client'
import { getSession } from '@/lib/auth'

interface PaperData {
  paperType: 'sectional' | 'full' | 'general' | ''
  department: string
  designation: string
  paperCode: string
  year: string
  shift: 'morning' | 'afternoon' | 'evening' | 'night' | ''
  paperName: string
  paperDescription: string
  passPercentage: number | ''
  negativeMarks: number | ''
  duration: number | ''
  isFree: boolean
  jsonFile: {
    name: string
    size: string
    uploadTime: string
    content: Question[] | { questions: Question[] }
  } | null
}

export default function PaperDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const departmentId = params.departmentId as string
  const paperId = params.paperId as string

  const [stage, setStage] = useState<'editor' | 'details'>('editor')
  const [currentPaper, setCurrentPaper] = useState<PaperData>({
    paperType: '', department: '', designation: '', paperCode: '',
    year: '', shift: '', paperName: '', paperDescription: '',
    passPercentage: '', negativeMarks: '', duration: '',
    isFree: false, jsonFile: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingPaper, setUpdatingPaper] = useState(false)

  useEffect(() => {
    if (departmentId && paperId) {
      fetchPaperDetails()
    } else {
      setError(`Invalid parameters: departmentId=${departmentId}, paperId=${paperId}`)
      setLoading(false)
    }
  }, [departmentId, paperId])

  const fetchPaperDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.get(API_ENDPOINTS.paperDetail(departmentId, paperId))
      if (!result.success) throw new Error(getErrorMessage(result))

      if (result.data) {
        const paper = result.data.paperDetails
        let questions = result.data.questions || []

        const answersResult = await apiClient.get(API_ENDPOINTS.paperAnswers(departmentId, paperId))
        if (!answersResult.success) throw new Error(getErrorMessage(answersResult))

        let answersMap = new Map()
        if (answersResult.data?.answers) {
          answersMap = new Map(
            answersResult.data.answers.map((ans: { id: number; correct: number }) => [ans.id, ans.correct])
          )
        }

        questions = questions.map((q: Record<string, unknown>) => ({
          ...q,
          correct: answersMap.get(q.id) ?? q.correct,
        }))

        setCurrentPaper({
          paperType: (paper.paperType as PaperData['paperType']) || '',
          department: paper.departmentId || '',
          designation: paper.designation || '',
          paperCode: paper.paperCode || '',
          year: paper.year ? String(paper.year) : '',
          shift: (paper.shift?.toLowerCase() as PaperData['shift']) || '',
          paperName: paper.name || '',
          paperDescription: paper.description || '',
          passPercentage: paper.passPercentage ?? '',
          negativeMarks: paper.negativeMarking ?? '',
          duration: paper.duration ?? '',
          isFree: paper.isFree || false,
          jsonFile: {
            name: (paper as Record<string, unknown> & { metadata?: { filename?: string } }).metadata?.filename || 'questions.json',
            size: `${(JSON.stringify(questions).length / 1024).toFixed(1)} KB`,
            uploadTime: 'loaded from server',
            content: { questions },
          },
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load paper details')
    } finally {
      setLoading(false)
    }
  }

  const updatePaper = async () => {
    setUpdatingPaper(true)
    try {
      const session = getSession()
      const questions = (currentPaper.jsonFile?.content as { questions?: unknown[] })?.questions || []

      const payload = {
        departmentId: currentPaper.department || undefined,
        designation: currentPaper.paperType === 'general' ? undefined : (currentPaper.designation || undefined),
        paperCode: currentPaper.paperType === 'full' ? undefined : (currentPaper.paperCode || undefined),
        paperType: currentPaper.paperType,
        name: currentPaper.paperName,
        description: currentPaper.paperDescription,
        year: Number(currentPaper.year),
        shift: currentPaper.shift.charAt(0).toUpperCase() + currentPaper.shift.slice(1),
        totalQuestions: questions.length,
        passPercentage: Number(currentPaper.passPercentage),
        negativeMarking: Number(currentPaper.negativeMarks),
        duration: Number(currentPaper.duration),
        isFree: currentPaper.isFree,
        questions,
        username: session?.username || 'unknown',
      }

      const result = await apiClient.patch(API_ENDPOINTS.updatePaper(paperId), payload)
      if (!result.success) throw new Error(getErrorMessage(result))

      toast.success('Paper updated successfully!')
      router.push('/papers')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update paper')
    } finally {
      setUpdatingPaper(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-warm-50 min-h-screen">
        <PageHeader title="Paper Details" subtitle="Loading…" />
        <div className="px-4 md:px-8 py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-warm-400" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-warm-50 min-h-screen">
        <PageHeader title="Paper Details" subtitle="Error" />
        <div className="px-4 md:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error loading paper</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => router.push('/papers')}
                className="text-sm text-red-700 underline mt-2 hover:text-red-900"
              >
                Back to Papers
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'editor') {
    return (
      <PaperJsonEditor
        onBack={() => router.push('/papers')}
        onNext={(updatedData) => {
          setCurrentPaper(p => ({
            ...p,
            jsonFile: p.jsonFile ? { ...p.jsonFile, content: updatedData } : null,
          }))
          setStage('details')
        }}
        initialQuestions={currentPaper.jsonFile?.content}
        fileName={currentPaper.jsonFile?.name}
        allowJsonEdit={true}
      />
    )
  }

  return (
    <div className="bg-warm-50 min-h-screen">
      <PageHeader
        title="Paper Details"
        subtitle={
          currentPaper.jsonFile ? (
            <>File: <span className="font-semibold text-rail-800 bg-amber-100 px-2 py-0.5 rounded-md">{currentPaper.jsonFile.name}</span></>
          ) : (
            'Update paper information'
          )
        }
      />
      <div className="px-4 md:px-8 py-6">
        <PaperDetailsForm
          currentPaper={currentPaper}
          setCurrentPaper={setCurrentPaper}
          onBack={() => setStage('editor')}
          onSubmit={updatePaper}
          isSubmitting={updatingPaper}
          submitButtonText="Update Paper"
        />
      </div>
    </div>
  )
}
