import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import PaymentForm from "@/components/payment-form";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  MapPin,
  Users,
  ArrowLeft,
  Clock,
  Ticket,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function EventPage({
  params,
}: {
  params: { eventId: string };
}) {
  const supabase = await createClient();

  // Fetch the event details
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      `
      id,
      title,
      description,
      upi_id,
      qr_code_url,
      event_date,
      registration_deadline,
      max_participants,
      status,
      organizer:users!organizer_id(name, email),
      participants:participants(count)
    `
    )
    .eq("id", params.eventId)
    .single();

  if (eventError || !event) {
    return notFound();
  }

  // Type assertion for organizer
  const organizer = event.organizer as { name: string; email: string }[] | null;

  // Check if event is active
  if (event.status !== "active") {
    return (
      <>
        <Navbar />
        <main className="min-h-[80vh] flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="mb-6">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Event Not Available</h1>
            <p className="text-gray-600 mb-8">
              This event is no longer accepting registrations.
            </p>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  // Fetch pricing tiers
  const { data: pricingTiers, error: tiersError } = await supabase
    .from("pricing_tiers")
    .select("id, name, description, price")
    .eq("event_id", params.eventId)
    .order("price", { ascending: true });

  if (tiersError) {
    console.error("Error fetching pricing tiers:", tiersError);
  }

  const eventDate = new Date(event.event_date);
  const participantCount = event.participants?.length || 0;
  const isRegistrationClosed =
    event.max_participants && participantCount >= event.max_participants;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <div className="mb-8">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-white">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Events
                </Button>
              </Link>
            </div>

            <div className="space-y-8">
              {/* Main Content */}
              <Card className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        {event.status.charAt(0).toUpperCase() +
                          event.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Organized by {organizer?.[0]?.name || "Anonymous"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center p-3 bg-white rounded-lg border">
                    <CalendarIcon className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-medium">
                        {eventDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {eventDate.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-white rounded-lg border">
                    <Users className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Participants</p>
                      <p className="font-medium">
                        {participantCount} / {event.max_participants || "∞"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {isRegistrationClosed
                          ? "Registration Closed"
                          : "Spots Available"}
                      </p>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-gray-400" />
                      <h2 className="text-xl font-semibold">
                        About This Event
                      </h2>
                    </div>
                    <Separator />
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Registration Card */}
              <Card className="p-6 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-blue-600" />
                    Register Now
                  </h2>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {participantCount} / {event.max_participants || "∞"} Spots
                  </Badge>
                </div>

                {isRegistrationClosed ? (
                  <div className="text-center py-8">
                    <div className="bg-yellow-50 rounded-lg p-6 mb-6 border border-yellow-200">
                      <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                      <p className="text-yellow-800 font-medium">
                        This event has reached its maximum capacity.
                      </p>
                      <p className="text-yellow-700 text-sm mt-2">
                        Stay tuned for future events!
                      </p>
                    </div>
                    <Link href="/">
                      <Button
                        variant="outline"
                        className="w-full hover:bg-gray-50"
                      >
                        Browse Other Events
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-blue-800 font-medium">
                            Registration is Open!
                          </p>
                          <p className="text-blue-700 text-sm mt-1">
                            Complete your payment to secure your spot.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Secure payment processing</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Instant confirmation</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Email confirmation</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                      <p className="text-sm text-gray-600 text-center">
                        Event Date:{" "}
                        <span className="font-medium text-gray-900">
                          {eventDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </p>
                    </div>

                    <PaymentForm
                      eventId={event.id}
                      upiId={event.upi_id}
                      qrCodeUrl={event.qr_code_url}
                      pricingTiers={pricingTiers || []}
                    />
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
