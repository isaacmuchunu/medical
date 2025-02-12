import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"

export function RecentAppointments() {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold tracking-tight">Recent Appointments</h2>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Patient</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Time</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell>No recent appointments</TableCell>
						<TableCell></TableCell>
						<TableCell></TableCell>
						<TableCell></TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>
	)
}