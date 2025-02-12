"use client"

import { UserNav } from "./UserNav"
import { ModeToggle } from "./ModeToggle"
import { Button } from "@/components/ui/button"
import { BellIcon } from "lucide-react"

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <BellIcon className="h-5 w-5 text-medical-600" />
          </Button>
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}