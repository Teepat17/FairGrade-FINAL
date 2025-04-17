"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, History, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"
import { WelcomeTutorial } from "@/components/tutorial/welcome-tutorial"

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="container max-w-7xl mx-auto">
      <WelcomeTutorial />
      <div className="py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-lg text-muted-foreground">Manage and grade your student exams with AI assistance</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="h-6 w-6 text-primary" />
                <span>Start Grading</span>
              </CardTitle>
              <CardDescription className="text-base">Upload student exams and grade them with AI</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Upload student answer PDFs and select a rubric to start the AI-powered grading process.
              </p>
              <Button asChild className="w-full">
                <Link href="/grading" className="flex items-center justify-center">
                  Start Grading
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <History className="h-6 w-6 text-primary" />
                <span>Grading History</span>
              </CardTitle>
              <CardDescription className="text-base">View your past grading sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Access your previous grading sessions, review results, and download reports.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/history" className="flex items-center justify-center">
                  View History
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BookOpen className="h-6 w-6 text-primary" />
                <span>Manage Rubrics</span>
              </CardTitle>
              <CardDescription className="text-base">Create and manage grading rubrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Create, edit, and manage your grading rubrics for different subjects and exam types.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/rubrics" className="flex items-center justify-center">
                  Manage Rubrics
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Recent Grading Sessions</CardTitle>
              <CardDescription className="text-base">Your most recent exam grading sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <div className="font-medium">No recent grading sessions</div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/history">View all</Link>
                  </Button>
                </div>
                <div className="p-8 text-center">
                  <p className="text-base text-muted-foreground">
                    You haven&apos;t graded any exams yet. Start by creating a new grading session.
                  </p>
                  <Button asChild className="mt-6">
                    <Link href="/grading" className="flex items-center justify-center">
                      Start Grading
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
