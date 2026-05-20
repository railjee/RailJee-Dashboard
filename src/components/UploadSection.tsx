'use client'

import { useState } from 'react'
import { Upload, Check } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from './PageHeader'
import { Button } from './ui/button'
import { PaperJsonEditor, Question } from './PaperJsonEditor'
import { PaperDetailsForm } from './PaperDetailsForm'
import { API_ENDPOINTS } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { apiClient, getErrorMessage } from '@/lib/api-client'

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
  jsonFile: { name: string; size: string; uploadTime: string; content: Question[] | { questions: Question[] } } | null
}

const INITIAL_PAPER: PaperData = {
  paperType: '', department: '', designation: '', paperCode: '',
  year: new Date().getFullYear().toString(), shift: 'morning',
  paperName: '', paperDescription: '',
  passPercentage: 70, negativeMarks: 0.33, duration: 120,
  isFree: false, jsonFile: null,
}

export function UploadSection() {
  const [stage, setStage] = useState<'upload' | 'editor' | 'details'>('upload')
  const [currentPaper, setCurrentPaper] = useState<PaperData>(INITIAL_PAPER)
  const [isDragActive, setIsDragActive] = useState(false)
  const [creatingPaper, setCreatingPaper] = useState(false)

  const readJsonFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large — maximum 5 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string)
        setCurrentPaper(p => ({
          ...p,
          jsonFile: {
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            uploadTime: 'just now',
            content,
          },
        }))
      } catch {
        toast.error('Invalid JSON file')
      }
    }
    reader.onerror = () => toast.error('Failed to read file')
    reader.readAsText(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIsDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      readJsonFile(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readJsonFile(file)
    e.target.value = ''
  }

  const createPaper = async () => {
    setCreatingPaper(true)
    try {
      const session = getSession()
      const questions = (currentPaper.jsonFile?.content as { questions?: unknown[] })?.questions ?? []
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
        metadata: { filename: currentPaper.jsonFile?.name ?? '' },
      }
      const result = await apiClient.post(API_ENDPOINTS.createPaper, payload)
      if (!result.success) throw new Error(getErrorMessage(result))
      toast.success('Paper created successfully!')
      setCurrentPaper(INITIAL_PAPER)
      setStage('upload')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create paper')
    } finally {
      setCreatingPaper(false)
    }
  }

  /* ── Editor stage ── */
  if (stage === 'editor') {
    return (
      <PaperJsonEditor
        onBack={() => setStage('upload')}
        onNext={(updatedData) => {
          setCurrentPaper(p => ({
            ...p,
            jsonFile: p.jsonFile ? { ...p.jsonFile, content: updatedData } : null,
          }))
          setStage('details')
        }}
        initialQuestions={currentPaper.jsonFile?.content}
        fileName={currentPaper.jsonFile?.name}
      />
    )
  }

  /* ── Details stage ── */
  if (stage === 'details') {
    return (
      <div className="bg-warm-50 min-h-screen">
        <PageHeader
          title="Paper Details"
          subtitle={
            currentPaper.jsonFile ? (
              <>File: <span className="font-semibold text-rail-800 bg-amber-100 px-2 py-0.5 rounded-md">{currentPaper.jsonFile.name}</span></>
            ) : (
              'Fill in the paper information'
            )
          }
        />
        <div className="px-4 md:px-8 py-6">
          <PaperDetailsForm
            currentPaper={currentPaper}
            setCurrentPaper={setCurrentPaper}
            onBack={() => setStage('editor')}
            onSubmit={createPaper}
            isSubmitting={creatingPaper}
            submitButtonText="Create Paper"
          />
        </div>
      </div>
    )
  }

  /* ── Upload stage ── */
  return (
    <div className="bg-warm-50 min-h-screen">
      <PageHeader
        title="Upload Paper"
        subtitle="Upload a JSON file to get started"
      />
      <div className="px-4 md:px-8 py-6">
        <div className="max-w-xl space-y-5">
          {/* Drop zone */}
          <div>
            <p className="text-xs font-semibold text-rail-700 uppercase tracking-wider mb-2">
              Questions JSON File <span className="text-red-400">*</span>
            </p>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200
                ${isDragActive
                  ? 'border-rail-400 bg-rail-50'
                  : currentPaper.jsonFile
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-warm-300 hover:border-warm-400 hover:bg-warm-50'
                }
              `}
            >
              {currentPaper.jsonFile ? (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-emerald-800">{currentPaper.jsonFile.name}</p>
                  <p className="text-sm text-emerald-600">{currentPaper.jsonFile.size}</p>
                  <button
                    onClick={() => setCurrentPaper(p => ({ ...p, jsonFile: null }))}
                    className="text-sm text-emerald-600 hover:text-emerald-800 underline"
                  >
                    Change file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-warm-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-rail-800">Drop your JSON file here</p>
                    <p className="text-sm text-warm-400 mt-1">or click to browse</p>
                  </div>
                  <label>
                    <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">Choose File</span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <ul className="text-xs text-warm-500 space-y-1">
            <li>· Supported format: JSON only</li>
            <li>· Maximum file size: 5 MB</li>
          </ul>

          {/* Next button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!currentPaper.jsonFile}
            onClick={() => currentPaper.jsonFile && setStage('editor')}
          >
            Next: Edit Questions
          </Button>
        </div>
      </div>
    </div>
  )
}
