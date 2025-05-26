import { ArrowUpRight } from "lucide-react";

export default function CTAStoryboard() {
  return (
    <div className="bg-gray-50 p-8 text-center">
      <h2 className="text-3xl font-bold mb-4">
        Ready to Simplify Your Event Payments?
      </h2>
      <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
        Join hundreds of event organizers who've eliminated payment headaches
        with our UPI verification system.
      </p>
      <a
        href="/dashboard"
        className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Create Your First Event
        <ArrowUpRight className="ml-2 w-4 h-4" />
      </a>
    </div>
  );
}
