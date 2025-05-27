import { createClient } from "../../../../../supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, IndianRupee } from "lucide-react";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select(
      `
      *,
      pricing_tiers (
        id,
        name,
        price
      )
    `
    )
    .eq("id", params.id)
    .single();

  if (error || !event) {
    notFound();
  }

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
    <main className="w-full bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  {event.title}
                </CardTitle>
                <Badge className={getStatusColor(event.status)}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Event Date</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(event.event_date), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Max Participants</p>
                    <p className="font-medium text-gray-900">
                      {event.max_participants || "Unlimited"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <IndianRupee className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Pricing Tiers</p>
                    <p className="font-medium text-gray-900">
                      {event.pricing_tiers?.length || 0} options
                    </p>
                  </div>
                </div>
              </div>

              {event.pricing_tiers && event.pricing_tiers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pricing Options
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {event.pricing_tiers.map((tier: any) => (
                      <Card key={tier.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">
                                {tier.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {tier.description}
                              </p>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              ₹{tier.price}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
