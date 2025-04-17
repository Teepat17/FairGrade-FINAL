"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, ClipboardCheck, BookOpen, Home, History, Settings, Menu } from "lucide-react"

const TUTORIAL_STEPS = [
  {
    title: "Welcome to FairGrade!",
    description: "Let's take a quick tour of the main features to help you get started. We'll show you how to navigate and use the system effectively.",
    icon: null,
    highlight: null,
  },
  {
    title: "Navigation Menu",
    description: "Use the sidebar menu to access different sections. On mobile, click the menu icon in the top-left corner.",
    icon: Menu,
    highlight: ".sidebar-menu",
    position: "right",
  },
  {
    title: "Dashboard",
    description: "This is your home page where you can see an overview of your recent activities and quick access to main features.",
    icon: Home,
    highlight: "main",
    position: "bottom",
  },
  {
    title: "Grade Exams",
    description: "Upload student exams and answer keys to grade them automatically using AI. Our system will analyze and provide detailed feedback.",
    icon: FileText,
    highlight: "[href='/grading']",
    position: "right",
  },
  {
    title: "Push & Check",
    description: "Compare student answers with the answer key to identify similarities and differences. Perfect for quick assessments.",
    icon: ClipboardCheck,
    highlight: "[href='/push-and-check']",
    position: "right",
  },
  {
    title: "Grading History",
    description: "Access your past grading sessions, review results, and download reports for record keeping.",
    icon: History,
    highlight: "[href='/history']",
    position: "right",
  },
  {
    title: "Manage Rubrics",
    description: "Create and customize grading rubrics for different subjects and exam types. Save them for future use.",
    icon: BookOpen,
    highlight: "[href='/rubrics']",
    position: "right",
  },
  {
    title: "Settings",
    description: "Configure your account settings, notification preferences, and customize your grading experience.",
    icon: Settings,
    highlight: "[href='/settings']",
    position: "right",
  }
]

export function WelcomeTutorial() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial")
    if (!hasSeenTutorial) {
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    if (open && currentStep > 0) {
      const highlightElement = TUTORIAL_STEPS[currentStep].highlight
      if (highlightElement) {
        const element = document.querySelector(highlightElement)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('tutorial-highlight')
        }
      }
      return () => {
        const element = document.querySelector(highlightElement)
        if (element) {
          element.classList.remove('tutorial-highlight')
        }
      }
    }
  }, [currentStep, open])

  const handleClose = () => {
    localStorage.setItem("hasSeenTutorial", "true")
    setOpen(false)
  }

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentTutorialStep = TUTORIAL_STEPS[currentStep]
  const Icon = currentTutorialStep.icon

  return (
    <>
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 50;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
      `}</style>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-primary" />}
              {currentTutorialStep.title}
            </DialogTitle>
            <DialogDescription>{currentTutorialStep.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
              >
                Previous
              </Button>
            )}
            {currentStep === 0 && (
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Skip tutorial
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep === TUTORIAL_STEPS.length - 1 ? "Get started" : "Next"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 