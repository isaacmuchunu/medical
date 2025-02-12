"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Appointment } from "@/types"

export function RecentAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const response = await fetch('/api/appointments/recent')
        const data = await response.json()
        setAppointments(data)
      } catch (error) {
        console.error('Failed to fetch appointments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8 pt-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={appointment.patient?.photo} alt="Avatar" />
            <AvatarFallback>
              {appointment.patient?.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {appointment.patient?.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(appointment.dateTime).toLocaleDateString()} at{" "}
              {new Date(appointment.dateTime).toLocaleTimeString()}
            </p>
          </div>
          <div className="ml-auto">
            <Badge
              variant={appointment.status === "confirmed" ? "default" : "secondary"}
              className="bg-medical-500"
            >
              {appointment.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
} 