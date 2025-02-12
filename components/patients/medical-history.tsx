"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { AddConditionDialog } from "./add-condition-dialog"
import type { MedicalHistory } from "@/types"

interface MedicalHistoryProps {
  patientId: string
}

export function MedicalHistory({ patientId }: MedicalHistoryProps) {
  const [history, setHistory] = useState<MedicalHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchMedicalHistory() {
      try {
        const response = await fetch(`/api/patients/${patientId}/medical-history`)
        const data = await response.json()
        setHistory(data)
      } catch (error) {
        console.error('Failed to fetch medical history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMedicalHistory()
  }, [patientId])

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Medical Conditions</h3>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Condition
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {history?.conditions.map((condition) => (
            <div key={condition.id} className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{condition.name}</h4>
                  <Badge>{condition.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()}
                </p>
                {condition.notes && (
                  <p className="mt-2 text-sm">{condition.notes}</p>
                )}
              </div>
            </div>
          ))}

          {(!history?.conditions || history.conditions.length === 0) && (
            <p className="text-sm text-muted-foreground">No medical conditions recorded</p>
          )}
        </div>
      </Card>

      <AddConditionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patientId={patientId}
        onConditionAdded={(newCondition) => {
          setHistory(prev => ({
            ...prev!,
            conditions: [...(prev?.conditions || []), newCondition]
          }))
        }}
      />
    </div>
  )
} 