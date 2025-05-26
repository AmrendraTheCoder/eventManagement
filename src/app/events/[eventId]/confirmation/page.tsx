import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../../supabase/server";

export default async function PaymentConfirmationPage({
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

  // Fetch the event details
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", params.eventId)
    .single();

  if (eventError || !event) {
    return redirect("/");
  }

  // Fetch the user's payment for this event
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, status, created_at")
    .eq("event_id", params.eventId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (paymentError) {
    return redirect(`/events/${params.eventId}`);
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">Payment Submitted!</h1>

          <p className="text-gray-600 mb-8">
            Thank you for submitting your payment for{" "}
            <strong>{event.title}</strong>. Your payment is now pending
            verification by the event organizer.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium mb-4">Payment Details</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-left text-gray-500">Payment ID:</div>
              <div className="text-right font-medium">{payment.id}</div>

              <div className="text-left text-gray-500">Status:</div>
              <div className="text-right font-medium">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending Verification
                </span>
              </div>

              <div className="text-left text-gray-500">Submitted on:</div>
              <div className="text-right font-medium">
                {new Date(payment.created_at).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-8">
            You will receive a notification once your payment has been verified.
            You can also check the status of your payment in your dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button variant="default">Go to Dashboard</Button>
            </Link>

            <Link href="/">
              <Button variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
