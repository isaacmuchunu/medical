"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NavLink } from "./NavLink"
import {
  CalendarDays as CalendarIcon,
  Users as UserIcon,
  ClipboardIcon,
  HeartPulseIcon,
  LayoutDashboard as ActivityIcon,
  MessageSquare as MessageSquareIcon,
  Settings as SettingsIcon,
  LogOutIcon,
  Video as VideoIcon,
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-medical-800">
            MedicalApp
          </h2>
          <div className="space-y-1">
            <NavLink href="/dashboard" icon={ActivityIcon}>
              Dashboard
            </NavLink>
            <NavLink href="/appointments" icon={CalendarIcon}>
              Appointments
            </NavLink>
            <NavLink href="/patients" icon={UserIcon}>
              Patients
            </NavLink>
            <NavLink href="/medical-records" icon={ClipboardIcon}>
              Medical Records
            </NavLink>
            <NavLink href="/prescriptions" icon={HeartPulseIcon}>
              Prescriptions
            </NavLink>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-medical-800">
            Communication
          </h2>
          <div className="space-y-1">
            <NavLink href="/messages" icon={MessageSquareIcon}>
              Messages
            </NavLink>
            <NavLink href="/video-calls" icon={VideoIcon}>
              Video Calls
            </NavLink>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-medical-800">
            Settings
          </h2>
          <div className="space-y-1">
            <NavLink href="/settings" icon={SettingsIcon}>
              Settings
            </NavLink>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-medical-600 hover:text-medical-900 hover:bg-medical-100"
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 