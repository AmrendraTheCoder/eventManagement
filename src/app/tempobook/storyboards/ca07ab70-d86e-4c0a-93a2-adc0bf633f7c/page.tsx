import EventForm from "@/components/event-form";

export default function EventFormStoryboard() {
  return (
    <div className="bg-white min-h-screen p-8">
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
  );
}
