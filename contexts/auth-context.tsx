"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type User = {
  id: string
  name: string
  email: string
}

type StoredUser = User & {
  password: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USERS_STORAGE_KEY = "fairgrade_users"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("current_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  // Get stored users
  const getStoredUsers = (): StoredUser[] => {
    const users = localStorage.getItem(USERS_STORAGE_KEY)
    return users ? JSON.parse(users) : []
  }

  // Save users to storage
  const saveUsers = (users: StoredUser[]) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      // TODO: Implement actual login logic here
      setUser({ email })
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setLoading(true)
    try {
      // TODO: Implement actual registration logic here
      const users = getStoredUsers()
      
      // Check if email already exists
      if (users.some(u => u.email === email)) {
        throw new Error("Email already registered")
      }

      // Create new user
      const newUser: StoredUser = {
        id: "user-" + Math.random().toString(36).substr(2, 9),
        name,
        email,
        password
      }

      // Save user to storage
      saveUsers([...users, newUser])

      // Don't store password in current user
      const { password: _, ...userData } = newUser
      setUser(userData)
      localStorage.setItem("current_user", JSON.stringify(userData))
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      // TODO: Implement actual logout logic here
      setUser(null)
      localStorage.removeItem("current_user")
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
