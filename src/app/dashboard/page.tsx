import DashboardNavbar from "@/components/dashboard-navbar";
import {
  InfoIcon,
  UserCircle,
  Calendar,
  CreditCard,
  FileCheck,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user's events count
  const { count: eventsCount, error: eventsError } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("organizer_id", user.id);

  // Fetch user's payments count
  const { count: paymentsCount, error: paymentsError } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Fetch user's events first to get event IDs
  const { data: userEvents } = await supabase
    .from("events")
    .select("id")
    .eq("organizer_id", user.id);

  const eventIds = userEvents?.map((event) => event.id) || [];

  // Fetch pending payments count (for organizers)
  const { count: pendingPaymentsCount, error: pendingError } =
    eventIds.length > 0
      ? await supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .in("event_id", eventIds)
      : { count: 0 };

  // Fetch verified payments count
  const { count: verifiedPaymentsCount } =
    eventIds.length > 0
      ? await supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .eq("status", "verified")
          .in("event_id", eventIds)
      : { count: 0 };

  // Fetch recent events
  const { data: recentEvents } = await supabase
    .from("events")
    .select("id, title, event_date, status")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back! Here's what's happening with your events.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link href="/dashboard/create-event" className="block group">
              <Card className="hover:shadow-lg transition-all duration-200 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-600 rounded-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-blue-900">
                        Create Event
                      </h3>
                      <p className="text-blue-700 text-sm">
                        Set up a new event with UPI payments
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/manage-events" className="block group">
              <Card className="hover:shadow-lg transition-all duration-200 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 group-hover:from-purple-100 group-hover:to-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-600 rounded-lg">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-purple-900">
                        Manage Events
                      </h3>
                      <p className="text-purple-700 text-sm">
                        View and manage your events
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/manage-events" className="block group">
              <Card className="hover:shadow-lg transition-all duration-200 border-green-200 bg-gradient-to-br from-green-50 to-green-100 group-hover:from-green-100 group-hover:to-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-600 rounded-lg">
                      <FileCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-green-900">
                        Verify Payments
                      </h3>
                      <p className="text-green-700 text-sm">
                        Review pending payments
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Events
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {eventsCount || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Events created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending Verifications
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {pendingPaymentsCount || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Verified Payments
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {verifiedPaymentsCount || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Successfully verified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Your Payments
                </CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {paymentsCount || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Payments made</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Recent Events</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentEvents && recentEvents.length > 0 ? (
                  <div className="space-y-4">
                    {recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(event.event_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            event.status === "active"
                              ? "bg-green-100 text-green-800"
                              : event.status === "completed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>
                    ))}
                    <Link href="/dashboard/manage-events">
                      <Button variant="outline" className="w-full mt-4">
                        View All Events
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No events created yet</p>
                    <Link href="/dashboard/create-event">
                      <Button>Create Your First Event</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCircle className="h-5 w-5" />
                  <span>Account Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Account Email</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Quick Actions
                    </h4>
                    <div className="space-y-2">
                      <Link href="/dashboard/create-event" className="block">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Create New Event
                        </Button>
                      </Link>
                      {(pendingPaymentsCount ?? 0) > 0 && (
                        <Link href="/dashboard/manage-events" className="block">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <FileCheck className="mr-2 h-4 w-4" />
                            Review {pendingPaymentsCount} Pending Payment
                            {pendingPaymentsCount !== 1 ? "s" : ""}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
