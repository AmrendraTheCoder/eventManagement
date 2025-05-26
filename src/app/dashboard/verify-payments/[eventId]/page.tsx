import DashboardNavbar from "@/components/dashboard-navbar";
import PaymentVerification from "@/components/payment-verification";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../../../supabase/server";

export default async function VerifyPaymentsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch the event to verify ownership
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, organizer_id")
    .eq("id", params.eventId)
    .single();

  if (eventError || !event) {
    return notFound();
  }

  // Check if the user is the organizer
  if (event.organizer_id !== user.id) {
    return redirect("/dashboard/manage-events");
  }

  // Fetch payments for this event with user information
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(
      `
      id,
      user_id,
      amount,
      transaction_id,
      upi_reference,
      payment_screenshot_url,
      status,
      created_at,
      user:users!user_id(name, email)
    `,
    )
    .eq("event_id", params.eventId);

  if (paymentsError) {
    console.error("Error fetching payments:", paymentsError);
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center mb-8">
              <Link href="/dashboard/manage-events">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Events
                </Button>
              </Link>
            </div>

            <header className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Verify Payments</h1>
              <p className="text-gray-600">Event: {event.title}</p>
            </header>

            <PaymentVerification
              payments={payments || []}
              eventId={params.eventId}
            />
          </div>
        </div>
      </main>
    </>
  );
}
