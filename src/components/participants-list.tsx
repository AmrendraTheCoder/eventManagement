"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import { format } from "date-fns";
import { Users, Mail, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ParticipantsListProps {
  eventId: string;
}

export default function ParticipantsList({ eventId }: ParticipantsListProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("participants")
        .select(
          `
          *,
          users!user_id (
            name,
            email
          ),
          payments!payment_id (
            amount,
            status,
            created_at
          )
        `
        )
        .eq("event_id", eventId)
        .order("id", { ascending: false });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchParticipants();
    }
  }, [open, eventId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-gray-600 hover:text-gray-900"
        >
          <Users className="h-4 w-4 mr-2" />
          View Participants
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-3xl"
        aria-describedby="participants-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Event Participants
          </DialogTitle>
          <p id="participants-description" className="text-sm text-gray-500">
            List of all participants who have registered for this event
          </p>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900"></div>
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No participants yet
            </h3>
            <p className="text-gray-500">
              Participants will appear here once their payments are verified
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Participant
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Registration Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {participants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">
                          {participant.users?.name || "Unknown"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {participant.users?.email || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={getStatusColor(participant.status)}>
                          {participant.status.charAt(0).toUpperCase() +
                            participant.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {format(
                            new Date(
                              participant.payments?.created_at || new Date()
                            ),
                            "MMM d, yyyy"
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">
                          ₹{participant.payments?.amount || "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
