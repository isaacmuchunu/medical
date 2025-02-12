import { Card } from "@/components/ui/card"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { Overview } from "@/components/dashboard/overview"
import { RecentAppointments } from "@/components/dashboard/recent-appointments"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-medical-900">
          Dashboard
        </h2>
        <CalendarDateRangePicker />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Patients
            </h3>
            <div className="text-2xl font-bold">2,543</div>
            <p className="text-xs text-muted-foreground">
              +180 from last month
            </p>
          </div>
        </Card>
        {/* Add more stat cards */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <div className="p-6">
            <h3 className="text-lg font-medium">Overview</h3>
            <Overview />
          </div>
        </Card>
        <Card className="col-span-3">
          <div className="p-6">
            <h3 className="text-lg font-medium">Recent Appointments</h3>
            <RecentAppointments />
          </div>
        </Card>
      </div>
    </div>
  )
} 