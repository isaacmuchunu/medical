import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Edit, Phone, Mail, MapPin } from "lucide-react"
import type { Patient } from "@/types"

interface PatientProfileProps {
  patient: Patient
}

export function PatientProfile({ patient }: PatientProfileProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={patient.profile.photo} />
            <AvatarFallback>{patient.profile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="text-2xl font-bold">{patient.profile.name}</h2>
            <p className="text-sm text-muted-foreground">Medical ID: {patient.medicalId}</p>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                {patient.profile.phone}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                {patient.profile.email}
              </div>
              {patient.profile.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {patient.profile.address}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>
      
      <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Date of Birth</p>
          <p className="font-medium">
            {new Date(patient.profile.dateOfBirth).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Gender</p>
          <p className="font-medium capitalize">{patient.profile.gender}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Blood Type</p>
          <p className="font-medium">{patient.profile.bloodType || 'Not specified'}</p>
        </div>
      </div>
    </Card>
  )
} 