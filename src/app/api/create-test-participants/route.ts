import { createClient } from "../../../../supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Authenticated user:", user.id);

    const { eventId, count = 5 } = await request.json();
    console.log("Creating test participants for event:", eventId, "count:", count);

    if (!eventId) {
      console.error("No event ID provided");
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Verify the event exists and user is the organizer
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(`
        id,
        organizer_id,
        pricing_tiers (
          id,
          name,
          price
        )
      `)
      .eq("id", eventId)
      .eq("organizer_id", user.id)
      .single();

    if (eventError) {
      console.error("Error fetching event:", eventError);
      return NextResponse.json(
        { error: "Event not found or unauthorized" },
        { status: 404 }
      );
    }

    if (!event) {
      console.error("Event not found:", eventId);
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    console.log("Found event:", {
      id: event.id,
      organizer_id: event.organizer_id,
      pricing_tiers_count: event.pricing_tiers?.length
    });

    if (!event.pricing_tiers || event.pricing_tiers.length === 0) {
      console.error("No pricing tiers found for event:", eventId);
      return NextResponse.json(
        { error: "No pricing tiers found for this event" },
        { status: 400 }
      );
    }

    console.log("Found pricing tiers:", event.pricing_tiers);

    const testParticipants = [];
    const testNames = [
      "John Doe",
      "Jane Smith", 
      "Mike Johnson",
      "Sarah Wilson",
      "David Brown",
      "Emily Davis",
      "Chris Miller",
      "Lisa Garcia",
      "Tom Anderson",
      "Amy Taylor"
    ];

    // Create test participants
    for (let i = 0; i < Math.min(count, 10); i++) {
      try {
        const randomTier = event.pricing_tiers[Math.floor(Math.random() * event.pricing_tiers.length)];
        const testName = testNames[i] || `Test User ${i + 1}`;
        const testEmail = `test${i + 1}@example.com`;
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create a test user for this participant
        const { data: testUser, error: userError } = await supabase.auth.admin.createUser({
          email: testEmail,
          password: `Test${timestamp}${randomStr}`,
          email_confirm: true,
          user_metadata: {
            name: testName,
            is_test_user: true
          }
        });

        if (userError) {
          console.error("Error creating test user:", userError);
          continue;
        }

        if (!testUser?.user?.id) {
          console.error("No user ID returned from user creation");
          continue;
        }

        console.log(`Creating test participant ${i + 1}:`, {
          name: testName,
          email: testEmail,
          tier: randomTier.name,
          amount: randomTier.price,
          event_id: eventId,
          user_id: testUser.user.id
        });

        // Create payment record
        const paymentData = {
          event_id: eventId,
          user_id: testUser.user.id,
          pricing_tier_id: randomTier.id,
          amount: randomTier.price,
          transaction_id: `TEST_${timestamp}_${randomStr}`,
          upi_reference: `TEST_REF_${timestamp}_${randomStr}`,
          status: Math.random() > 0.3 ? "verified" : "pending",
          verification_notes: `Test participant: ${testName} (${testEmail})`
        };

        console.log("Creating payment with data:", paymentData);

        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .insert(paymentData)
          .select()
          .single();

        if (paymentError) {
          console.error("Error creating test payment:", paymentError);
          // Delete the test user if payment creation fails
          await supabase.auth.admin.deleteUser(testUser.user.id);
          continue;
        }

        console.log("Created payment:", payment);

        // Create participant record
        const participantData = {
          event_id: eventId,
          user_id: testUser.user.id,
          payment_id: payment.id,
          status: "registered",
        };

        console.log("Creating participant with data:", participantData);

        const { error: participantError } = await supabase
          .from("participants")
          .insert(participantData);

        if (participantError) {
          console.error("Error creating participant:", participantError);
          // Delete the payment and test user if participant creation fails
          await supabase
            .from("payments")
            .delete()
            .eq("id", payment.id);
          await supabase.auth.admin.deleteUser(testUser.user.id);
          continue;
        }

        console.log("Created participant for payment:", payment.id);

        testParticipants.push({
          name: testName,
          email: testEmail,
          tier: randomTier.name,
          amount: randomTier.price,
          status: payment.status,
        });
      } catch (error) {
        console.error(`Error creating test participant ${i + 1}:`, error);
        continue;
      }
    }

    if (testParticipants.length === 0) {
      console.error("Failed to create any test participants");
      return NextResponse.json(
        { error: "Failed to create any test participants" },
        { status: 500 }
      );
    }

    console.log("Successfully created test participants:", testParticipants);

    return NextResponse.json({
      success: true,
      message: `Created ${testParticipants.length} test participants`,
      participants: testParticipants,
    });

  } catch (error) {
    console.error("Error creating test participants:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 