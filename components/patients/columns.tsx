"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PatientActions } from "./patient-actions"
import type { Patient } from "@/types"

export const columns: ColumnDef<Patient>[] = [
  {
    accessorKey: "profile",
    header: "Patient",
    cell: ({ row }) => {
      const profile = row.getValue("profile") as Patient["profile"]
      return (
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={profile.photo} />
            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{profile.name}</div>
            <div className="text-sm text-muted-foreground">{profile.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "medicalId",
    header: "Medical ID",
  },
  {
    accessorKey: "lastVisit",
    header: "Last Visit",
    cell: ({ row }) => {
      const date = row.getValue("lastVisit") as string
      return date ? new Date(date).toLocaleDateString() : "Never"
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "active" ? "default" : "secondary"}>
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <PatientActions patient={row.original} />,
  },
] 