"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader } from "@/components/ui/loader"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, Lock, Mail, Hash, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // UI State
  const [activeTab, setActiveTab] = React.useState<"student" | "admin">("student")
  const [isLoading, setIsLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  
  // Login Fields State
  const [password, setPassword] = React.useState("")
  const [rollNumber, setRollNumber] = React.useState("")
  const [email, setEmail] = React.useState("")

  // Redirect if session already exists
  React.useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role
      if (role === "admin") {
        router.push("/admin")
      } else {
        router.push("/student")
      }
    }
  }, [session, status, router])

  // Clear messages and fields when toggling tab
  const handleTabChange = (val: string) => {
    if (isLoading) return
    setActiveTab(val as "student" | "admin")
    setErrorMessage(null)
    setSuccessMessage(null)
    setPassword("")
    setRollNumber("")
    setEmail("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    
    // Validations
    if (activeTab === "student") {
      if (!rollNumber || !password) {
        setErrorMessage("Please fill in both Roll Number and Password.")
        return
      }
    } else {
      if (!email || !password) {
        setErrorMessage("Please fill in both Email and Password.")
        return
      }
    }

    setIsLoading(true)

    try {
      const identifier = activeTab === "student" ? rollNumber : email

      // Call NextAuth Sign In credentials provider
      const response = await signIn("credentials", {
        identifier: identifier.trim(),
        password,
        redirect: false,
      })

      if (response?.error) {
        throw new Error("Invalid credentials. Please verify your details or contact your administrator.")
      }

      setSuccessMessage("Login successful! Redirecting...")
      
      // Determine redirection path using the authenticated NextAuth session
      const { getSession } = await import("next-auth/react")
      const updatedSession = await getSession()
      const userRole = (updatedSession?.user as any)?.role || activeTab

      setTimeout(() => {
        router.push(userRole === "admin" ? "/admin" : "/student")
      }, 1000)

    } catch (err: any) {
      setIsLoading(false)
      setErrorMessage(err.message || "An error occurred during authentication. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-br from-primary/5 via-background to-secondary/5">
      
      {/* Top Header Logo */}
      <div className="flex items-center gap-2 mb-8 animate-fade-in">
        <div className="p-2 bg-primary rounded-xl text-primary-foreground shadow-xs">
          <GraduationCap className="size-6" />
        </div>
        <span className="font-heading text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Cissikar Exams
        </span>
      </div>

      {/* Main Authentication Card */}
      <Card className="w-full max-w-md border shadow-xl relative overflow-hidden bg-background/80 backdrop-blur-md">
        
        {/* Subtle decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-primary" />

        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Access Portal
          </CardTitle>
          <CardDescription className="text-sm">
            Sign in using your assigned academic credentials.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          
          {/* Error Alert */}
          {errorMessage && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="size-4 shrink-0 text-destructive" />
              <div>
                <AlertTitle className="text-xs font-bold">Authentication Error</AlertTitle>
                <AlertDescription className="text-[11px] leading-snug">
                  {errorMessage}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Success Alert */}
          {successMessage && (
            <Alert className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 py-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
              <div>
                <AlertTitle className="text-xs font-bold">Success</AlertTitle>
                <AlertDescription className="text-[11px] leading-snug">
                  {successMessage}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Custom Tabs Component for switching Roles */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full flex">
              <TabsTrigger value="student" className="flex-1 cursor-pointer" disabled={isLoading}>Student</TabsTrigger>
              <TabsTrigger value="admin" className="flex-1 cursor-pointer" disabled={isLoading}>Administrator</TabsTrigger>
            </TabsList>

            {/* Student Login Form */}
            <TabsContent value="student" className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="rollNumber">
                    Roll Number
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="rollNumber"
                      type="text"
                      placeholder="e.g. 20261004"
                      className="pl-9 h-9"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="studentPassword">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="studentPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 h-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-2 h-9 cursor-pointer" 
                  disabled={isLoading || status === "loading"}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader size="sm" variant="default" className="text-current" />
                      Authenticating...
                    </span>
                  ) : (
                    "Login as Student"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Admin Login Form */}
            <TabsContent value="admin" className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="adminEmail">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="e.g. admin@cissikar.com"
                      className="pl-9 h-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="adminPassword">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 h-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-2 h-9 cursor-pointer" 
                  disabled={isLoading || status === "loading"}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader size="sm" variant="default" className="text-current" />
                      Authenticating...
                    </span>
                  ) : (
                    "Login as Admin"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

        </CardContent>

        <CardFooter className="bg-muted/30 border-t py-4 justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="size-3.5 text-primary animate-pulse" />
            <span>Secure exam session</span>
          </span>
          <a href="#" className="hover:underline hover:text-foreground">Forgot Password?</a>
        </CardFooter>
      </Card>
      
      {/* Tiny instructions or credits */}
      <p className="mt-6 text-xs text-muted-foreground text-center max-w-sm leading-normal">
        By signing in, you agree to comply with our academic integrity and online proctoring policy requirements.
      </p>

    </div>
  )
}
