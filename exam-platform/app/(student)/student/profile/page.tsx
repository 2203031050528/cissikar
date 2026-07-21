"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  User,
  Mail,
  Hash,
  GraduationCap,
  Shield,
  Calendar,
  LogOut,
} from "lucide-react"
import { Loader } from "@/components/ui/loader"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function StudentProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({ redirect: false })
      router.push("/login")
    } catch (err) {
      console.error("Signout error:", err)
      router.push("/login")
    }
  }

  if (status === "loading") {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader size="lg" />
        <span className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading profile...
        </span>
      </div>
    )
  }

  const user = session?.user
  const fullName = user?.name || "Student User"
  const email = user?.email || "Not provided"
  const rollNumber = (user as any)?.roll_number || "N/A"
  const role = (user as any)?.role || "student"

  // Compute initials
  const initials = fullName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
          My Profile
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View your account information and session details.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="border shadow-xs md:col-span-1">
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <div className="size-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
              {initials}
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">{fullName}</h2>
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              >
                {role}
              </Badge>
            </div>

            <div className="w-full border-t pt-4 mt-2">
              <Button
                variant="destructive"
                size="sm"
                className="w-full cursor-pointer gap-2 font-semibold"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader size="sm" variant="default" className="text-current" />
                ) : (
                  <>
                    <LogOut className="size-4" />
                    <span>Logout</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="border shadow-xs md:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold">Account Information</CardTitle>
            <CardDescription className="text-xs">
              Your personal details as registered in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {[
              {
                label: "Full Name",
                value: fullName,
                icon: User,
                color: "text-primary bg-primary/10",
              },
              {
                label: "Email Address",
                value: email,
                icon: Mail,
                color: "text-blue-500 bg-blue-500/10",
              },
              {
                label: "Roll Number",
                value: rollNumber,
                icon: Hash,
                color: "text-amber-500 bg-amber-500/10",
              },
              {
                label: "Role",
                value: role.charAt(0).toUpperCase() + role.slice(1),
                icon: Shield,
                color: "text-emerald-500 bg-emerald-500/10",
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${item.color} shrink-0`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">{item.value}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Card className="border shadow-xs bg-muted/20">
        <CardContent className="py-4 px-5 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
            <Shield className="size-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">Security Notice</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your account is secured with encrypted credentials. All exam sessions are monitored 
              for academic integrity. Contact your institution's administrator if you need to update 
              your account details or reset your password.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
