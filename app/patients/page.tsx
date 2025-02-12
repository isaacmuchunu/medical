"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/components/patients/columns"
import { Spinner } from "@/components/ui/spinner"
import { AddPatientDialog } from "@/components/patients/add-patient-dialog"
import type { Patient } from "@/types"

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  async function fetchPatients() {
    try {
      const response = await fetch('/api/patients')
      const data = await response.json()
      setPatients(data.patients)
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <DataTable columns={columns} data={patients} />

      <AddPatientDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPatientAdded={(patient) => {
          setPatients(prev => [...prev, patient])
        }}
      />
    </div>
  )
} 