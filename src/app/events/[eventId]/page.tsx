import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import PaymentForm from "@/components/payment-form";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MapPin, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../../supabase/server";

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
    `,
    )
    .eq("id", params.eventId)
    .single();

  if (eventError || !event) {
    return notFound();
  }

  // Check if event is active
  if (event.status !== "active") {
    return (
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Event Not Available</h1>
          <p className="text-gray-600 mb-8">
            This event is no longer accepting registrations.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
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
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  {eventDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>

                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-2" />
                  {participantCount} / {event.max_participants || "∞"}{" "}
                  participants
                </div>
              </div>

              {event.description && (
                <div className="prose max-w-none mb-8">
                  <h2 className="text-xl font-semibold mb-2">
                    About This Event
                  </h2>
                  <p className="text-gray-700">{event.description}</p>
                </div>
              )}

              {isRegistrationClosed ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                  <p className="text-yellow-800 font-medium">
                    Registration is closed. This event has reached its maximum
                    capacity.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                  <p className="text-blue-800 font-medium">
                    Registration is open! Complete your payment to secure your
                    spot.
                  </p>
                </div>
              )}
            </div>

            <div className="md:col-span-1">
              <div className="bg-white border rounded-lg p-6 sticky top-8">
                <h2 className="text-xl font-semibold mb-6">
                  Register for this Event
                </h2>

                {isRegistrationClosed ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      Sorry, this event has reached its maximum capacity.
                    </p>
                    <Link href="/">
                      <Button variant="outline">Browse Other Events</Button>
                    </Link>
                  </div>
                ) : (
                  <PaymentForm
                    eventId={event.id}
                    upiId={event.upi_id}
                    qrCodeUrl={event.qr_code_url}
                    pricingTiers={pricingTiers || []}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
