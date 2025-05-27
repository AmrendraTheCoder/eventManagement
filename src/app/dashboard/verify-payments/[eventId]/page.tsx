"use client";

import { createClient } from "../../../../../supabase/client";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Users,
  IndianRupee,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import { useEffect, useState } from "react";
import ParticipantsList from "@/components/participants-list";

export default function VerifyPaymentsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const [payments, setPayments] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      console.log("Starting data fetch for event:", params.eventId);
      try {
        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", params.eventId)
          .single();

        console.log("Event data:", eventData);
        console.log("Event error:", eventError);

        if (eventError) throw eventError;
        setEvent(eventData);

        // Fetch payments with participant details and user information
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select(
            `
            *,
            pricing_tiers (
              name,
              price,
              description
            ),
            users!user_id (
              name,
              email
            )
          `
          )
          .eq("event_id", params.eventId)
          .order("created_at", { ascending: false });

        console.log("Payments data:", paymentsData);
        console.log("Payments error:", paymentsError);

        if (paymentsError) throw paymentsError;
        setPayments(paymentsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.eventId, supabase]);

  // Categorize payments
  const verifiedPayments = payments.filter((p) => p.status === "verified");
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const rejectedPayments = payments.filter((p) => p.status === "rejected");

  console.log("Categorized payments:", {
    verified: verifiedPayments,
    pending: pendingPayments,
    rejected: rejectedPayments,
  });

  // Calculate totals
  const totalAmount = verifiedPayments.reduce(
    (sum, p) => sum + (p.pricing_tiers?.price || 0),
    0
  );
  const pendingAmount = pendingPayments.reduce(
    (sum, p) => sum + (p.pricing_tiers?.price || 0),
    0
  );

  console.log("Calculated amounts:", {
    totalAmount,
    pendingAmount,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const handleVerify = async (paymentId: string) => {
    try {
      // First update the payment status
      const { error: paymentError } = await supabase
        .from("payments")
        .update({ status: "verified" })
        .eq("id", paymentId);

      if (paymentError) throw paymentError;

      // Get the payment details to get user_id and event_id
      const { data: payment, error: fetchError } = await supabase
        .from("payments")
        .select("user_id, event_id")
        .eq("id", paymentId)
        .single();

      if (fetchError) throw fetchError;

      // Check if participant already exists
      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("id")
        .eq("event_id", payment.event_id)
        .eq("user_id", payment.user_id)
        .single();

      if (existingParticipant) {
        // Update existing participant
        const { error: updateError } = await supabase
          .from("participants")
          .update({ status: "active" })
          .eq("id", existingParticipant.id);

        if (updateError) throw updateError;
      } else {
        // Create new participant
        const { error: insertError } = await supabase
          .from("participants")
          .insert({
            event_id: payment.event_id,
            user_id: payment.user_id,
            status: "active",
            payment_id: paymentId,
          });

        if (insertError) throw insertError;
      }

      // Refresh the payments list
      const updatedPayments = payments.map((p) =>
        p.id === paymentId ? { ...p, status: "verified" } : p
      );
      setPayments(updatedPayments);

      toast.success("Payment verified successfully!");
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      toast.error(error.message || "Failed to verify payment");
    }
  };

  const handleReject = async (paymentId: string) => {
    console.log("Rejecting payment:", paymentId);
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "rejected",
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", paymentId);

      if (error) throw error;

      toast.success("Payment rejected");

      // Refresh the data
      const { data: updatedPayments } = await supabase
        .from("payments")
        .select(
          `
          *,
          pricing_tiers (
            name,
            price,
            description
          ),
          users!user_id (
            name,
            email
          )
        `
        )
        .eq("event_id", params.eventId)
        .order("created_at", { ascending: false });

      console.log("Updated payments after rejection:", updatedPayments);
      setPayments(updatedPayments || []);
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("Failed to reject payment");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!event) {
    console.log("Event not found, returning 404");
    return notFound();
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payment Verification
              </h1>
              <p className="text-gray-600">
                Verify payments and manage participants for {event?.title}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <ParticipantsList eventId={params.eventId} />
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Verified
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
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
                  Pending Verification
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
                  {verifiedPayments.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">Verified users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Rejected Payments
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {rejectedPayments.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Failed verifications
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payments Tabs */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger
                    value="pending"
                    className="flex items-center space-x-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>Pending ({pendingPayments.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="verified"
                    className="flex items-center space-x-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verified ({verifiedPayments.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="rejected"
                    className="flex items-center space-x-2"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Rejected ({rejectedPayments.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="flex items-center space-x-2"
                  >
                    <IndianRupee className="h-4 w-4" />
                    <span>All ({payments.length})</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Tier
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Payment Details
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pendingPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.users?.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {payment.users?.email}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.pricing_tiers?.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {payment.pricing_tiers?.description}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                ₹{payment.pricing_tiers?.price}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                UPI ID: {payment.upi_reference}
                              </div>
                              <div className="text-xs text-gray-500">
                                Ref: {payment.transaction_id}
                              </div>
                              {payment.payment_screenshot_url && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-1"
                                    >
                                      <ImageIcon className="h-4 w-4 mr-1" />
                                      View Screenshot
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Payment Screenshot
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="relative w-full h-[400px]">
                                      <Image
                                        src={payment.payment_screenshot_url}
                                        alt="Payment Screenshot"
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-500">
                                {format(
                                  new Date(payment.created_at),
                                  "MMM d, yyyy h:mm a"
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleVerify(payment.id)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Verify
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleReject(payment.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
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
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Tier
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Payment Details
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Verified At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {verifiedPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.users?.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {payment.users?.email}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.pricing_tiers?.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {payment.pricing_tiers?.description}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                ₹{payment.pricing_tiers?.price}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                UPI ID: {payment.upi_reference}
                              </div>
                              <div className="text-xs text-gray-500">
                                Ref: {payment.transaction_id}
                              </div>
                              {payment.payment_screenshot_url && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-1"
                                    >
                                      <ImageIcon className="h-4 w-4 mr-1" />
                                      View Screenshot
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Payment Screenshot
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="relative w-full h-[400px]">
                                      <Image
                                        src={payment.payment_screenshot_url}
                                        alt="Payment Screenshot"
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-500">
                                {format(
                                  new Date(payment.verified_at),
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

                <TabsContent value="rejected" className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Tier
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Payment Details
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Rejected At
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rejectedPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.users?.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {payment.users?.email}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.pricing_tiers?.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {payment.pricing_tiers?.description}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                ₹{payment.pricing_tiers?.price}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                UPI ID: {payment.upi_reference}
                              </div>
                              <div className="text-xs text-gray-500">
                                Ref: {payment.transaction_id}
                              </div>
                              {payment.payment_screenshot_url && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-1"
                                    >
                                      <ImageIcon className="h-4 w-4 mr-1" />
                                      View Screenshot
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Payment Screenshot
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="relative w-full h-[400px]">
                                      <Image
                                        src={payment.payment_screenshot_url}
                                        alt="Payment Screenshot"
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-500">
                                {format(
                                  new Date(payment.verified_at),
                                  "MMM d, yyyy h:mm a"
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleVerify(payment.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="all" className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Tier
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            Payment Details
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
                        {payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.users?.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {payment.users?.email}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {payment.pricing_tiers?.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {payment.pricing_tiers?.description}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                ₹{payment.pricing_tiers?.price}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                UPI ID: {payment.upi_reference}
                              </div>
                              <div className="text-xs text-gray-500">
                                Ref: {payment.transaction_id}
                              </div>
                              {payment.payment_screenshot_url && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-1"
                                    >
                                      <ImageIcon className="h-4 w-4 mr-1" />
                                      View Screenshot
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>
                                        Payment Screenshot
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="relative w-full h-[400px]">
                                      <Image
                                        src={payment.payment_screenshot_url}
                                        alt="Payment Screenshot"
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(payment.status)}
                                <Badge
                                  className={getStatusColor(payment.status)}
                                >
                                  {payment.status.charAt(0).toUpperCase() +
                                    payment.status.slice(1)}
                                </Badge>
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
