"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientProfile } from "@/components/patients/patient-profile"
import { MedicalHistory } from "@/components/patients/medical-history"
import { AppointmentHistory } from "@/components/patients/appointment-history"
import { InsuranceInfo } from "@/components/patients/insurance-info"
import { Spinner } from "@/components/ui/spinner"
import { useParams } from "next/navigation"
import type { Patient } from "@/types"

export default function PatientDetailsPage() {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()

  useEffect(() => {
    async function fetchPatient() {
      try {
        const response = await fetch(`/api/patients/${params.id}`)
        const data = await response.json()
        setPatient(data)
      } catch (error) {
        console.error('Failed to fetch patient:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPatient()
  }, [params.id])

  if (loading) return <Spinner />
  if (!patient) return <div>Patient not found</div>

  return (
    <div className="flex flex-col gap-8">
      <PatientProfile patient={patient} />
      
      <Tabs defaultValue="medical-history" className="w-full">
        <TabsList>
          <TabsTrigger value="medical-history">Medical History</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="medical-history">
          <MedicalHistory patientId={patient.id} />
        </TabsContent>
        
        <TabsContent value="appointments">
          <AppointmentHistory patientId={patient.id} />
        </TabsContent>
        
        <TabsContent value="insurance">
          <InsuranceInfo patientId={patient.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 