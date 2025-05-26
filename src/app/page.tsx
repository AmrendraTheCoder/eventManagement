import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import {
  ArrowUpRight,
  CheckCircle2,
  Shield,
  Users,
  Zap,
  QrCode,
  CreditCard,
  FileCheck,
  BellRing,
} from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Event Payment Management System
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A streamlined platform for collecting and verifying UPI payments
              for small-scale events, eliminating manual coordination.
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
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
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
                Set up your event with custom pricing tiers and UPI payment
                details
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
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">90%</div>
              <div className="text-blue-100">
                Time Saved vs. Manual Verification
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Events Successfully Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Fraud Detection Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Simplify Your Event Payments?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of event organizers who've eliminated payment
            headaches with our UPI verification system.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Event
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
