import { CreditCard, QrCode, FileCheck, Shield } from "lucide-react";

export default function FeaturesComponentStoryboard() {
  return (
    <div className="bg-white p-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">
          Event Payment Management System
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          A streamlined platform for collecting and verifying UPI payments for
          small-scale events, eliminating manual coordination.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          {
            icon: <CreditCard className="w-6 h-6" />,
            title: "Event Creation Dashboard",
            description:
              "Create events with UPI payment details, custom pricing, and participant limits",
          },
          {
            icon: <QrCode className="w-6 h-6" />,
            title: "UPI Payment Flow",
            description:
              "Dynamic QR codes with a 3-step process: scan, pay, upload proof",
          },
          {
            icon: <FileCheck className="w-6 h-6" />,
            title: "Verification Interface",
            description:
              "Side-by-side view of payment proof vs. bank statement with quick verify/reject actions",
          },
          {
            icon: <Shield className="w-6 h-6" />,
            title: "Anti-Fraud System",
            description:
              "Screenshot duplicate detection and transaction ID validation",
          },
        ].map((feature, index) => (
          <div
            key={index}
            className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-blue-600 mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
