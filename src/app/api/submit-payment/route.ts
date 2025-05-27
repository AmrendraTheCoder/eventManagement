import { createClient } from "../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  validateUpiTransactionId,
  generatePaymentReference,
} from "@/utils/upi";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const {
      eventId,
      pricingTierId,
      amount,
      transactionId,
      upiReference,
    } = await request.json();

    // Validate required fields
    if (!eventId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate transaction ID if provided
    if (transactionId && !validateUpiTransactionId(transactionId)) {
      return NextResponse.json(
        { error: "Invalid transaction ID format" },
        { status: 400 },
      );
    }

    // Generate reference if not provided
    const reference =
      upiReference || generatePaymentReference(eventId, user.id);

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        event_id: eventId,
        user_id: user.id,
        pricing_tier_id: pricingTierId,
        amount,
        transaction_id: transactionId,
        upi_reference: reference,
        status: "pending",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      return NextResponse.json(
        { error: "Failed to submit payment" },
        { status: 500 },
      );
    }

    // Register as participant
    const { error: participantError } = await supabase
      .from("participants")
      .insert({
        event_id: eventId,
        user_id: user.id,
        payment_id: payment.id,
        status: "registered",
      });

    if (participantError) {
      console.error("Error registering participant:", participantError);
      // Continue despite error with participant registration
    }

    return NextResponse.json({
      success: true,
      message: "Payment submitted successfully",
      payment,
    });
  } catch (error) {
    console.error("Unexpected error submitting payment:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
