import DashboardNavbar from "@/components/dashboard-navbar";
import EventForm from "@/components/event-form";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";

export default async function CreateEventPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
              <p className="text-gray-600">
                Set up your event details, UPI payment information, and pricing
                tiers.
              </p>
            </header>

            <EventForm />
          </div>
        </div>
      </main>
    </>
  );
}
