'use client'

import { useState } from 'react'
import { Upload, Check } from 'lucide-react'
import { PageHeader } from './PageHeader'
import { PaperJsonEditor } from './PaperJsonEditor'
import { PaperDetailsForm } from './PaperDetailsForm'
import { API_ENDPOINTS } from '@/lib/api'

interface PaperData {
  paperType: 'sectional' | 'full' | 'general' | ''
  department: string
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
    content: any
  } | null
}

export function UploadSection() {
  const [stage, setStage] = useState<'upload' | 'editor' | 'details'>('upload')
  const [currentPaper, setCurrentPaper] = useState<PaperData>({
    paperType: '',
    department: '',
    paperCode: '',
    year: new Date().getFullYear().toString(),
    shift: 'morning',
    paperName: '',
    paperDescription: '',
    passPercentage: 70,
    negativeMarks: 0.33,
    duration: 120,
    isFree: true,
    jsonFile: null,
  })
  const [isDragActive, setIsDragActive] = useState<string | null>(null)
  const [creatingPaper, setCreatingPaper] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive('question')
    } else if (e.type === 'dragleave') {
      setIsDragActive(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(null)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      
      // Check file size (10 MB limit)
      const maxSize = 10 * 1024 * 1024 // 10 MB in bytes
      if (file.size > maxSize) {
        alert('File is too large. Maximum file size is 10 MB.')
        return
      }
      
      // Handle JSON file drop
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const content = JSON.parse(event.target?.result as string)
            const fileData = {
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              uploadTime: 'just now',
              content: content,
            }
            setCurrentPaper({ ...currentPaper, jsonFile: fileData })
          } catch (error) {
            alert('Invalid JSON file. Please upload a valid JSON file.')
            console.error('JSON parse error:', error)
          }
        }
        reader.onerror = () => {
          alert('Failed to read file. Please try again.')
        }
        reader.readAsText(file)
      }
    }
  }

  const createPaper = async () => {
    setCreatingPaper(true)
    try {
      // Extract questions from JSON file
      const questions = currentPaper.jsonFile?.content?.questions || []
      
      // Extract sections and other metadata from JSON
      const totalQuestions = questions.length

      const payload = {
        departmentId: currentPaper.department || undefined,
        paperCode: currentPaper.paperType === 'full' ? undefined : (currentPaper.paperCode || undefined),
        paperType: currentPaper.paperType,
        name: currentPaper.paperName,
        description: currentPaper.paperDescription,
        year: Number(currentPaper.year),
        shift: currentPaper.shift.charAt(0).toUpperCase() + currentPaper.shift.slice(1),
        totalQuestions,
        passPercentage: Number(currentPaper.passPercentage),
        negativeMarking: Number(currentPaper.negativeMarks),
        duration: Number(currentPaper.duration),
        isFree: currentPaper.isFree,
        questions,
        metadata: {
          filename: currentPaper.jsonFile?.name || '',
        },
      }

      const response = await fetch(API_ENDPOINTS.createPaper, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `API error: ${response.statusText}`)
      }

      const result = await response.json()
      alert('Paper created successfully!')
      console.log('Paper created:', result)

      // Reset form after successful creation
      setCurrentPaper({
        paperType: '',
        department: '',
        paperCode: '',
        year: new Date().getFullYear().toString(),
        shift: 'morning',
        paperName: '',
        paperDescription: '',
        passPercentage: 70,
        negativeMarks: 0.33,
        duration: 120,
        isFree: true,
        jsonFile: null,
      })
      setStage('upload')
    } catch (error) {
      console.error('Failed to create paper:', error)
      alert(`Failed to create paper: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreatingPaper(false)
    }
  }

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      
      // Check file size (10 MB limit)
      const maxSize = 10 * 1024 * 1024 // 10 MB in bytes
      if (file.size > maxSize) {
        alert('File is too large. Maximum file size is 10 MB.')
        e.target.value = '' // Reset input
        return
      }
      
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const content = JSON.parse(event.target?.result as string)
          const fileData = {
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            uploadTime: 'just now',
            content: content,
          }
          setCurrentPaper({ ...currentPaper, jsonFile: fileData })
          e.target.value = '' // Reset input after successful upload
        } catch (error) {
          alert('Invalid JSON file. Please upload a valid JSON file.')
          console.error('JSON parse error:', error)
          e.target.value = '' // Reset input on error
        }
      }
      
      reader.onerror = () => {
        alert('Failed to read file. Please try again.')
        e.target.value = '' // Reset input on error
      }
      
      reader.readAsText(file)
    }
  }

  return (
    <>
      {stage === 'editor' ? (
        <PaperJsonEditor
          onBack={() => setStage('upload')}
          onNext={(updatedData) => {
            // Update the jsonFile content with the edited data
            setCurrentPaper({
              ...currentPaper,
              jsonFile: currentPaper.jsonFile ? {
                ...currentPaper.jsonFile,
                content: updatedData
              } : null
            })
            setStage('details')
          }}
          initialQuestions={currentPaper.jsonFile?.content}
          fileName={currentPaper.jsonFile?.name}
        />
      ) : stage === 'details' ? (
        <div className="ml-56 bg-slate-50 min-h-screen">
          <PageHeader
            title="Paper Details"
            subtitle={
              currentPaper.jsonFile ? (
                <>
                  File: <span className="font-semibold text-slate-950 bg-yellow-100 px-2 py-0.5 rounded">{currentPaper.jsonFile.name}</span>
                </>
              ) : (
                'Fill in the paper information'
              )
            }
          />
          <div className="px-8 py-12">
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
      ) : (
        <div className="ml-56 bg-slate-50 min-h-screen">
          <PageHeader
            title="Upload Paper"
            subtitle="Upload JSON file to get started"
          />
          <div className="px-8 py-12">
            <div className="max-w-2xl space-y-6">
              {/* JSON File Upload */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  Questions JSON File <span className="text-red-500">*</span>
                </h3>
                <div
                  onDragEnter={(e) => handleDrag(e)}
                  onDragLeave={(e) => handleDrag(e)}
                  onDragOver={(e) => handleDrag(e)}
                  onDrop={(e) => handleDrop(e)}
                  className={`border-2 border-dashed p-8 text-center transition-colors ${
                    isDragActive === 'question'
                      ? 'border-slate-900 bg-slate-100'
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                  } ${currentPaper.jsonFile ? 'bg-green-50 border-green-300' : ''}`}
                >
                  {currentPaper.jsonFile ? (
                    <div className="text-center">
                      <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-900">
                        {currentPaper.jsonFile.name}
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        {currentPaper.jsonFile.size}
                      </p>
                      <button
                        onClick={() =>
                          setCurrentPaper({
                            ...currentPaper,
                            jsonFile: null,
                          })
                        }
                        className="mt-3 text-xs text-green-600 hover:text-green-800 underline"
                      >
                        Change file
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-4" />
                      <p className="text-base font-medium text-slate-950 mb-2">
                        Drop JSON file here
                      </p>
                      <p className="text-sm text-slate-600 mb-6">
                        or click to browse
                      </p>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => handleJsonFileChange(e)}
                          className="hidden"
                        />
                        <span className="btn-minimal-primary cursor-pointer">
                          Choose File
                        </span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>• Supported format: JSON only</p>
                <p>• Maximum file size: 10 MB</p>
              </div>

              {/* Button */}
              <button
                onClick={() => {
                  if (currentPaper.jsonFile) {
                    setStage('editor')
                  }
                }}
                disabled={!currentPaper.jsonFile}
                className={`w-full py-2 px-4 rounded font-medium transition-all ${
                  currentPaper.jsonFile
                    ? 'btn-minimal-primary'
                    : 'btn-minimal-primary opacity-50 cursor-not-allowed'
                }`}
              >
                Next: Edit Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
