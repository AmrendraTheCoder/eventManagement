"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import EventCard from "@/components/event-card";
import TestParticipantsButton from "@/components/test-participants-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  IndianRupee,
  Eye,
  Share2,
  Trash2,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import EventActions from "@/components/event-actions";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ShareEventDialog({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const eventUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/events/${eventId}`
      : "";
  const handleCopy = () => {
    if (!eventUrl) return;
    const tempInput = document.createElement("input");
    tempInput.value = eventUrl;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    toast.success("Event link copied to clipboard!");
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-blue-600 underline hover:text-blue-800 font-medium cursor-pointer">
          {eventTitle}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Event Link</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 items-center">
          <input
            type="text"
            value={eventUrl}
            readOnly
            className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-700 text-sm"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Copy className="h-4 w-4" /> Copy Link
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ManageEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Get user role
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        // Fetch events created by the user
        const { data: eventsData, error } = await supabase
          .from("events")
          .select(
            `
            id,
            title,
            description,
            event_date,
            max_participants,
            status,
            created_at,
            pricing_tiers (
              id,
              name,
              price
            )
          `
          )
          .eq("organizer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching events:", JSON.stringify(error));
          return;
        }

        // Fetch participant and payment counts separately for each event
        const eventsWithCounts = await Promise.all(
          (eventsData || []).map(async (event) => {
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
          })
        );

        setEvents(eventsWithCounts);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, supabase]);

  // Categorize events
  const activeEvents = events.filter((event) => event.status === "active");
  const completedEvents = events.filter(
    (event) => event.status === "completed"
  );
  const allEvents = events;

  // Calculate totals
  const totalEvents = events.length;
  const totalParticipants = events.reduce(
    (sum, event) => sum + event._count.participants,
    0
  );
  const totalPendingPayments = events.reduce(
    (sum, event) => sum + event._count.pending,
    0
  );
  const totalVerifiedPayments = events.reduce(
    (sum, event) => sum + event._count.verified,
    0
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleShare = async (eventId: string, title: string) => {
    try {
      const shareUrl = `${window.location.origin}/events/${eventId}`;
      await navigator.share({
        title: title,
        text: `Check out this event: ${title}`,
        url: shareUrl,
      });
    } catch (error) {
      // Fallback for browsers that don't support Web Share API
      const shareUrl = `${window.location.origin}/events/${eventId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Event link copied to clipboard!");
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast.success("Event deleted successfully!");
      setEvents(events.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event. Please try again.");
    }
  };

  const renderEventTable = (eventList: typeof events) => {
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Event
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Participants
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Payments
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {eventList.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <ShareEventDialog
                    eventId={event.id}
                    eventTitle={event.title}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {format(new Date(event.event_date), "MMM d, yyyy h:mm a")}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge className={getStatusColor(event.status)}>
                    {event.status.charAt(0).toUpperCase() +
                      event.status.slice(1)}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center text-sm text-gray-900">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    {event._count.participants} /{" "}
                    {event.max_participants || "∞"}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col text-sm">
                    <div className="flex items-center text-gray-900">
                      <span className="font-medium">
                        {event._count.verified}
                      </span>
                      <span className="text-gray-500 ml-1">verified</span>
                    </div>
                    {event._count.pending > 0 && (
                      <div className="flex items-center text-yellow-600 mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{event._count.pending} pending</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <EventActions eventId={event.id} title={event.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900"></div>
      </div>
    );
  }

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
            <div className="mt-4 md:mt-0">
              <Link href="/dashboard/create-event">
                <Button className="inline-flex items-center bg-gray-600 hover:bg-gray-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Events
                </CardTitle>
                <Calendar className="h-4 w-4 text-gray-600" />
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
                <Users className="h-4 w-4 text-gray-600" />
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
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
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
                  {renderEventTable(allEvents)}
                </TabsContent>

                <TabsContent value="active" className="mt-6">
                  {renderEventTable(activeEvents)}
                </TabsContent>

                <TabsContent value="completed" className="mt-6">
                  {renderEventTable(completedEvents)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      <Toaster />
    </>
  );
}
