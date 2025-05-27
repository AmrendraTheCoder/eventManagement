"use client";

import { Button } from "@/components/ui/button";
import {
  Eye,
  Copy,
  Trash2,
  CreditCard,
  Calendar,
  Users,
  Clock,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "../../supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import ParticipantsList from "./participants-list";

interface EventActionsProps {
  eventId: string;
  title: string;
}

export default function EventActions({ eventId, title }: EventActionsProps) {
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleCopyLink = () => {
    const eventUrl = `${window.location.origin}/events/${eventId}`;
    // Create a temporary input element
    const tempInput = document.createElement("input");
    tempInput.value = eventUrl;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    toast.success("Event link copied to clipboard!");
  };

  const handleDelete = async () => {
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
      window.location.reload();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event. Please try again.");
    }
  };

  const fetchEventDetails = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          pricing_tiers (
            id,
            name,
            price,
            description
          )
        `
        )
        .eq("id", eventId)
        .single();

      if (error) throw error;
      setEventDetails(data);
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to load event details");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
            onClick={fetchEventDetails}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Event Details
            </DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900"></div>
            </div>
          ) : eventDetails ? (
            <div className="space-y-8">
              {/* Header Section */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {eventDetails.title}
                    </h3>
                    <Badge
                      className={`px-3 py-1 text-sm font-medium border ${getStatusColor(eventDetails.status)}`}
                    >
                      {eventDetails.status.charAt(0).toUpperCase() +
                        eventDetails.status.slice(1)}
                    </Badge>
                  </div>
                  {eventDetails.qr_code_url && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={eventDetails.qr_code_url}
                        alt="Event QR Code"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <Separator />
              </div>

              {/* Description Section */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900">
                  About Event
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {eventDetails.description}
                </p>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <h4 className="font-medium">Event Date</h4>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {format(
                      new Date(eventDetails.event_date),
                      "MMM d, yyyy h:mm a"
                    )}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-5 w-5" />
                    <h4 className="font-medium">Registration Deadline</h4>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {eventDetails.registration_deadline
                      ? format(
                          new Date(eventDetails.registration_deadline),
                          "MMM d, yyyy h:mm a"
                        )
                      : "No deadline set"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Users className="h-5 w-5" />
                    <h4 className="font-medium">Max Participants</h4>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {eventDetails.max_participants || "Unlimited"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <IndianRupee className="h-5 w-5" />
                    <h4 className="font-medium">UPI ID</h4>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {eventDetails.upi_id}
                  </p>
                </div>
              </div>

              {/* Pricing Tiers Section */}
              {eventDetails.pricing_tiers &&
                eventDetails.pricing_tiers.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Pricing Options
                    </h4>
                    <div className="grid gap-4">
                      {eventDetails.pricing_tiers.map((tier: any) => (
                        <div
                          key={tier.id}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-900">
                                {tier.name}
                              </p>
                              {tier.description && (
                                <p className="text-sm text-gray-600">
                                  {tier.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <IndianRupee className="h-4 w-4 text-gray-600" />
                              <p className="text-xl font-bold text-gray-900">
                                {tier.price}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-2">
                Failed to load event details
              </div>
              <Button variant="outline" onClick={fetchEventDetails}>
                Try Again
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Link href={`/dashboard/verify-payments/${eventId}`}>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-gray-900"
        >
          <CreditCard className="h-4 w-4" />
        </Button>
      </Link>

      <ParticipantsList eventId={eventId} />

      <Button
        variant="ghost"
        size="sm"
        className="text-gray-600 hover:text-gray-900"
        onClick={handleCopyLink}
      >
        <Copy className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-900"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
