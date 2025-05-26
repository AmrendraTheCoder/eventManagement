import Link from "next/link";
import { CalendarIcon, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type EventCardProps = {
  event: {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    max_participants: number | null;
    status: "active" | "completed" | "cancelled";
    _count?: {
      participants: number;
      payments: number;
    };
  };
  isOrganizer?: boolean;
};

export default function EventCard({
  event,
  isOrganizer = false,
}: EventCardProps) {
  const eventDate = new Date(event.event_date);
  const isPastEvent = eventDate < new Date();

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
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">{event.title}</h3>
          <Badge className={getStatusColor(event.status)}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </Badge>
        </div>

        {event.description && (
          <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
        )}

        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {eventDate.toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>

          {event._count && (
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-2" />
              {event._count.participants} / {event.max_participants || "∞"}{" "}
              participants
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          {isOrganizer ? (
            <div className="flex gap-2">
              <Link href={`/dashboard/verify-payments/${event.id}`}>
                <Button variant="outline" size="sm">
                  Verify Payments
                </Button>
              </Link>
              <Link href={`/dashboard/manage-events/${event.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <Link href={`/events/${event.id}`}>
              <Button>{isPastEvent ? "View Details" : "Register Now"}</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
