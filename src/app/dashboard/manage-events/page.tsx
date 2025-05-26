import DashboardNavbar from "@/components/dashboard-navbar";
import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Users, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";

export default async function ManageEventsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch events created by the user
  const { data: events, error } = await supabase
    .from("events")
    .select(
      `
      id,
      title,
      description,
      event_date,
      max_participants,
      status,
      created_at
    `,
    )
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching events:", JSON.stringify(error));
  }

  // Fetch participant and payment counts separately for each event
  const eventsWithCounts = await Promise.all(
    (events || []).map(async (event) => {
      const { count: participantCount } = await supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id);

      const { count: paymentCount } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id);

      const { count: pendingCount } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("status", "pending");

      const { count: verifiedCount } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("status", "verified");

      return {
        ...event,
        _count: {
          participants: participantCount || 0,
          payments: paymentCount || 0,
          pending: pendingCount || 0,
          verified: verifiedCount || 0,
        },
      };
    }),
  );

  // Categorize events
  const activeEvents = eventsWithCounts.filter(
    (event) => event.status === "active",
  );
  const completedEvents = eventsWithCounts.filter(
    (event) => event.status === "completed",
  );
  const allEvents = eventsWithCounts;

  // Calculate totals
  const totalEvents = eventsWithCounts.length;
  const totalParticipants = eventsWithCounts.reduce(
    (sum, event) => sum + event._count.participants,
    0,
  );
  const totalPendingPayments = eventsWithCounts.reduce(
    (sum, event) => sum + event._count.pending,
    0,
  );
  const totalVerifiedPayments = eventsWithCounts.reduce(
    (sum, event) => sum + event._count.verified,
    0,
  );

  const renderEventGrid = (eventList: typeof eventsWithCounts) => {
    if (eventList.length === 0) {
      return (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No events found
          </h3>
          <p className="text-gray-600 mb-6">
            {totalEvents === 0
              ? "Create your first event to start collecting UPI payments"
              : "No events in this category"}
          </p>
          <Link href="/dashboard/create-event">
            <Button className="inline-flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {eventList.map((event) => (
          <EventCard key={event.id} event={event} isOrganizer={true} />
        ))}
      </div>
    );
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Manage Events
              </h1>
              <p className="text-gray-600">
                Organize and track your events, payments, and participants.
              </p>
            </div>
            <Link href="/dashboard/create-event">
              <Button className="mt-4 md:mt-0 inline-flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </Link>
          </div>

          {/* Stats Overview */}
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
                  {totalEvents}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {activeEvents.length} active, {completedEvents.length}{" "}
                  completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Participants
                </CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {totalParticipants}
                </div>
                <p className="text-xs text-gray-500 mt-1">Across all events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending Payments
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {totalPendingPayments}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Awaiting verification
                </p>
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
                  {totalVerifiedPayments}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Successfully processed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Events Tabs */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger
                    value="all"
                    className="flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>All Events ({totalEvents})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="active"
                    className="flex items-center space-x-2"
                  >
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Active ({activeEvents.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="flex items-center space-x-2"
                  >
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span>Completed ({completedEvents.length})</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  {renderEventGrid(allEvents)}
                </TabsContent>

                <TabsContent value="active" className="mt-6">
                  {renderEventGrid(activeEvents)}
                </TabsContent>

                <TabsContent value="completed" className="mt-6">
                  {renderEventGrid(completedEvents)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
