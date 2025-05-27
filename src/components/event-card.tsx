"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarIcon,
  Users,
  Eye,
  Share2,
  IndianRupee,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ShareEventDialog from "@/components/share-event-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardFooter } from "@/components/ui/card";

type EventCardProps = {
  event: {
    eventId: string;
    title: string;
    description: string | null;
    event_date: string;
    max_participants: number | null;
    status: "active" | "completed" | "cancelled";
    _count?: {
      participants: number;
      payments: number;
      pending: number;
      verified: number;
    };
  };
  isOrganizer?: boolean;
  onDelete?: (eventId: string) => void;
};

export default function EventCard({
  event,
  isOrganizer = false,
  onDelete,
}: EventCardProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const eventDate = new Date(event.event_date);
  const isPastEvent = eventDate < new Date();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/events/${event.eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
      });

      if (onDelete) {
        onDelete(event.eventId);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

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

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
          <Badge className={getStatusColor(event.status)}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </Badge>
        </div>

        {event.description && (
          <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
        )}

        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
            {eventDate.toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>

          {event._count && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-2 text-green-500" />
                <div>
                  <span className="font-medium text-gray-900">
                    {event._count.participants}
                  </span>
                  <span className="text-gray-500">
                    {" "}
                    / {event.max_participants || "∞"} participants
                  </span>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <IndianRupee className="h-4 w-4 mr-2 text-green-500" />
                <div>
                  <span className="font-medium text-gray-900">
                    {event._count.verified}
                  </span>
                  <span className="text-gray-500"> verified payments</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {isOrganizer ? (
            <>
              <Link href={`/events/${event.eventId}`} target="_blank">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareDialogOpen(true)}
                className="bg-white hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share Link
              </Button>
              <Link href={`/dashboard/verify-payments/${event.eventId}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Verify Payments
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-white hover:bg-red-50 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {isDeleting ? "Deleting..." : "Delete Event"}
              </Button>
            </>
          ) : (
            <Link href={`/events/${event.eventId}`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                {isPastEvent ? "View Details" : "Register Now"}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <CardFooter className="flex justify-between items-center p-4 bg-gray-50">
        <Link href={`/events/${event.eventId}`} target="_blank">
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </CardFooter>

      <ShareEventDialog
        eventId={event.eventId}
        eventTitle={event.title}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </Card>
  );
}
