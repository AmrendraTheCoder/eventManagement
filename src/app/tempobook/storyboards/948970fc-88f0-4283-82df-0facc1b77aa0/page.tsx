export default function HowItWorksStoryboard() {
  return (
    <div className="bg-gray-50 p-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">How It Works</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Our simple 3-step process makes collecting and verifying payments
          effortless
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        <div className="text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-2xl font-bold">1</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Create Your Event</h3>
          <p className="text-gray-600">
            Set up your event with custom pricing tiers and UPI payment details
          </p>
        </div>
        <div className="text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-2xl font-bold">2</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Collect Payments</h3>
          <p className="text-gray-600">
            Participants scan QR codes, make payments, and upload proof
          </p>
        </div>
        <div className="text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-2xl font-bold">3</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Verify & Manage</h3>
          <p className="text-gray-600">
            Quickly verify payments and manage participant lists
          </p>
        </div>
      </div>
    </div>
  );
}
