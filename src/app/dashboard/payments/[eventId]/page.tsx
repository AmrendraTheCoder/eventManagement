import { createClient } from "../../../../../supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, IndianRupee, Clock, TrendingUp } from "lucide-react";
import DashboardNavbar from "@/components/dashboard-navbar";

export default async function EventPaymentsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  // Fetch event details
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // Fetch payments with participant details
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(
      `
      *,
      participants (
        id,
        user_id,
        created_at
      ),
      pricing_tiers (
        name,
        price
      )
    `
    )
    .eq("event_id", params.id)
    .order("created_at", { ascending: false });

  if (paymentsError) {
    console.error("Error fetching payments:", paymentsError);
  }

  // Categorize payments
  const verifiedPayments =
    payments?.filter((p) => p.status === "verified") || [];
  const pendingPayments = payments?.filter((p) => p.status === "pending") || [];

  // Calculate totals
  const totalAmount = verifiedPayments.reduce(
    (sum, p) => sum + (p.pricing_tiers?.price || 0),
    0
  );
  const pendingAmount = pendingPayments.reduce(
    (sum, p) => sum + (p.pricing_tiers?.price || 0),
    0
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Details
            </h1>
            <p className="text-gray-600">{event.title}</p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Verified
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{totalAmount}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {verifiedPayments.length} payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending Payments
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  ₹{pendingAmount}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {pendingPayments.length} payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Participants
                </CardTitle>
                <Users className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {payments?.length || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Registered users</p>
              </CardContent>
            </Card>
          </div>

          {/* Payments Tabs */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger
                    value="all"
                    className="flex items-center space-x-2"
                  >
                    <IndianRupee className="h-4 w-4" />
                    <span>All Payments ({payments?.length || 0})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="verified"
                    className="flex items-center space-x-2"
                  >
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Verified ({verifiedPayments.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="flex items-center space-x-2"
                  >
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <span>Pending ({pendingPayments.length})</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Participant
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Tier
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {payments?.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.participants?.user_id}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.pricing_tiers?.name}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                ₹{payment.pricing_tiers?.price}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <Badge className={getStatusColor(payment.status)}>
                                {payment.status.charAt(0).toUpperCase() +
                                  payment.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-500">
                                {format(
                                  new Date(payment.created_at),
                                  "MMM d, yyyy h:mm a"
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="verified" className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Participant
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Tier
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {verifiedPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.participants?.user_id}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.pricing_tiers?.name}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                ₹{payment.pricing_tiers?.price}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-500">
                                {format(
                                  new Date(payment.created_at),
                                  "MMM d, yyyy h:mm a"
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="pending" className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Participant
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Tier
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pendingPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.participants?.user_id}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.pricing_tiers?.name}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                ₹{payment.pricing_tiers?.price}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-500">
                                {format(
                                  new Date(payment.created_at),
                                  "MMM d, yyyy h:mm a"
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
