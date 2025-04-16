"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { FileUploader } from "@/components/grading/file-uploader"
import { RubricSelector } from "@/components/grading/rubric-selector"
import { StudentPreview } from "@/components/grading/student-preview"
import { saveGradingSession, fileToBase64 } from "@/lib/storage"
import { initializeOCR, processStudentAnswers, processImage } from "@/lib/processing"
import { useAuth } from "@/contexts/auth-context"

export default function GradingPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [subject, setSubject] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState("")
  const [studentFiles, setStudentFiles] = useState<File[]>([])
  const [rubricText, setRubricText] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [gradingResults, setGradingResults] = useState<Array<{
    id: string;
    name: string;
    score: number;
    feedback: string;
    criteria: Array<{
      name: string;
      score: number;
      maxScore: number;
      feedback: string;
    }>;
  }> | null>(null)

  const router = useRouter()
  const { toast } = useToast()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleStudentFilesChange = (files: File[]) => {
    setStudentFiles(files)
  }

  const handleRubricChange = (newRubricText: string) => {
    setRubricText(newRubricText)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to start grading",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (!subject) {
      toast({
        title: "Subject required",
        description: "Please select a subject for grading",
        variant: "destructive",
      })
      return
    }

    if (studentFiles.length === 0) {
      toast({
        title: "Student files required",
        description: "Please upload at least one student answer file",
        variant: "destructive",
      })
      return
    }

    handleStartGrading()
  }

  const handleStartGrading = async () => {
    if (!user) return
    setIsSubmitting(true)

    try {
      // Initialize OCR
      await initializeOCR()

      // Get rubric text - now using the stored rubricText
      const currentRubricText = rubricText

      if (!currentRubricText) {
        toast({
          title: "Rubric required",
          description: "Please either upload a rubric or select criteria",
          variant: "destructive",
        })
        return
      }

      // Process student answers
      const results = await processStudentAnswers(studentFiles, currentRubricText)
      setGradingResults(results)

      // Create grading session
      const sessionId = `session-${Date.now()}`
      const session = {
        id: sessionId,
        userId: user.id,
        subject,
        sessionName,
        studentFiles: await Promise.all(studentFiles.map(file => fileToBase64(file))),
        rubricText: currentRubricText,
        rubricFile: null,
        useTemplateRubric: false,
        results,
        createdAt: new Date().toISOString(),
      }

      // Save to IndexedDB
      await saveGradingSession(session)

      toast({
        title: "Grading completed",
        description: "Your files have been processed and graded",
      })

      // Show results
      setShowPreview(true)
    } catch (error) {
      console.error("Grading error:", error)
      toast({
        title: "Error",
        description: "There was an error processing the files",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const subjects = [
    { id: "math", name: "Mathematics" },
    { id: "physics", name: "Physics" },
    { id: "biology", name: "Biology" },
    { id: "chemistry", name: "Chemistry" },
    { id: "english", name: "English" },
    { id: "social", name: "Social Studies" },
  ]

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Grade Exams</h1>
        <p className="text-muted-foreground">Upload student answers and select a rubric to start grading</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-5">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload Files</TabsTrigger>
                <TabsTrigger value="rubric">Select Rubric</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Details</CardTitle>
                    <CardDescription>Provide basic information about this grading session</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="session-name">Session Name</Label>
                      <Input
                        id="session-name"
                        placeholder="e.g., Math Midterm - Spring 2023"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <RadioGroup value={subject || ""} onValueChange={setSubject} className="grid grid-cols-2 gap-4">
                        {subjects.map((subj) => (
                          <div key={subj.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={subj.id} id={`subject-${subj.id}`} />
                            <Label htmlFor={`subject-${subj.id}`}>{subj.name}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Student Answer Files</CardTitle>
                    <CardDescription>Upload image files containing student exam answers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUploader
                      accept=".jpg,.jpeg,.png"
                      multiple={true}
                      onChange={handleStudentFilesChange}
                      maxFiles={30}
                    />
                    {studentFiles.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium">{studentFiles.length} file(s) selected</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  type="button"
                  onClick={() => setActiveTab("rubric")}
                  disabled={!subject || studentFiles.length === 0}
                  className="w-full"
                >
                  Continue to Rubric Selection
                </Button>
              </TabsContent>

              <TabsContent value="rubric" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Grading Rubric</CardTitle>
                    <CardDescription>Select a template rubric for grading</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {subject && (
                      <RubricSelector 
                        subject={subject} 
                        onRubricChange={handleRubricChange}
                      />
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("upload")} className="flex-1">
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !subject}
                    className="flex-1"
                  >
                    {isSubmitting ? "Processing..." : "Start Grading"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Grading Session</CardTitle>
                <CardDescription>Summary of your grading session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Session Name</h3>
                  <p className="font-medium">{sessionName || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Subject</h3>
                  <p className="font-medium">
                    {subject ? subjects.find((s) => s.id === subject)?.name : "Not selected"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Student Files</h3>
                  <p className="font-medium">{studentFiles.length} file(s)</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Rubric</h3>
                  <p className="font-medium">
                    {rubricText ? "Custom rubric" : "Template rubric"}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !subject || studentFiles.length === 0
                  }
                  className="w-full"
                >
                  {isSubmitting ? "Processing..." : "Start Grading"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>

      {/* Modified StudentPreview with results */}
      {studentFiles.length > 0 && (
        <StudentPreview
          files={studentFiles}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          gradingResults={gradingResults}
          showResults={!!gradingResults}
        />
      )}
    </div>
  )
}
