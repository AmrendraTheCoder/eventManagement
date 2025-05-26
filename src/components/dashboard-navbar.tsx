"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  UserCircle,
  Home,
  Calendar,
  CreditCard,
  FileCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" prefetch className="text-xl font-bold">
            UPI Verify
          </Link>

          <div className="hidden md:flex items-center space-x-4 ml-8">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/create-event"
              className="text-gray-600 hover:text-gray-900"
            >
              Create Event
            </Link>
            <Link
              href="/dashboard/manage-events"
              className="text-gray-600 hover:text-gray-900"
            >
              Manage Events
            </Link>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <Link href="/" className="hidden md:block">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/create-event">Create Event</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/manage-events">Manage Events</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
