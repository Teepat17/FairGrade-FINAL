"use client"

import type React from "react"

import { useState } from "react"
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

export default function GradingPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [subject, setSubject] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState("")
  const [studentFiles, setStudentFiles] = useState<File[]>([])
  const [rubricFile, setRubricFile] = useState<File | null>(null)
  const [useTemplateRubric, setUseTemplateRubric] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const handleStudentFilesChange = (files: File[]) => {
    setStudentFiles(files)
  }

  const handleRubricFileChange = (files: File[]) => {
    if (files.length > 0) {
      setRubricFile(files[0])
      setUseTemplateRubric(false)
    } else {
      setRubricFile(null)
    }
  }

  const handleUseTemplateChange = (value: string) => {
    setUseTemplateRubric(value === "template")
    if (value === "template") {
      setRubricFile(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

    if (!rubricFile && !useTemplateRubric) {
      toast({
        title: "Rubric required",
        description: "Please either upload a rubric or use a template",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real application, you would upload files to your server here
      // and start the AI grading process

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Grading started",
        description: "Your files have been uploaded and grading has begun",
      })

      // Navigate to a results page with a mock ID
      router.push(`/grading/results/session-${Date.now()}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error starting the grading process",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
                    <CardDescription>Choose how you want to define the grading criteria</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup
                      value={useTemplateRubric ? "template" : "upload"}
                      onValueChange={handleUseTemplateChange}
                    >
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="upload" id="rubric-upload" />
                        <div className="grid gap-1.5">
                          <Label htmlFor="rubric-upload" className="font-medium">
                            Upload your own rubric
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Upload a file containing your custom grading rubric
                          </p>
                          {!useTemplateRubric && (
                            <FileUploader
                              accept=".jpg,.jpeg,.png,.pdf,.docx,.txt"
                              multiple={false}
                              onChange={handleRubricFileChange}
                              maxFiles={1}
                            />
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-start space-x-2">
                        <RadioGroupItem value="template" id="rubric-template" />
                        <div className="grid gap-1.5">
                          <Label htmlFor="rubric-template" className="font-medium">
                            Use a template rubric
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Select a pre-defined template for{" "}
                            {subject ? subjects.find((s) => s.id === subject)?.name : "the selected subject"}
                          </p>
                          {useTemplateRubric && subject && <RubricSelector subject={subject} />}
                        </div>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("upload")} className="flex-1">
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || (!rubricFile && !useTemplateRubric)}
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
                    {rubricFile ? rubricFile.name : useTemplateRubric ? "Template rubric" : "Not selected"}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !subject || studentFiles.length === 0 || (!rubricFile && !useTemplateRubric)
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
    </div>
  )
}
