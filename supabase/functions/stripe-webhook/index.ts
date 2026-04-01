import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  try {
    const parts = sigHeader.split(",").reduce((acc, part) => {
      const [key, val] = part.split("=");
      acc[key.trim()] = val;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts["t"];
    const signature = parts["v1"];
    if (!timestamp || !signature) return false;

    const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
    if (age > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
    const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

    return expectedSig === signature;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const body = await req.text();
    const sigHeader = req.headers.get("stripe-signature") || "";

    if (WEBHOOK_SECRET) {
      const valid = await verifyStripeSignature(body, sigHeader, WEBHOOK_SECRET);
      if (!valid) {
        console.error("Invalid Stripe signature");
        return new Response("Invalid signature", { status: 400 });
      }
    }

    const event = JSON.parse(body);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const sessionId = session.id;
        const paymentIntentId = session.payment_intent;
        const customerEmail = session.customer_email || session.customer_details?.email;

        const { data: payment, error: payErr } = await supabase
          .from("payments")
          .update({
            status: "paid",
            stripe_payment_intent_id: paymentIntentId,
            stripe_customer_id: session.customer || null,
            paid_at: new Date().toISOString(),
          })
          .eq("stripe_session_id", sessionId)
          .select()
          .single();

        if (payErr) {
          console.error("Failed to update payment:", payErr);
          break;
        }

        if (payment.reference_type === "consulting_booking" && payment.reference_id) {
          await supabase
            .from("consulting_bookings")
            .update({
              payment_status: "paid",
              payment_intent_id: paymentIntentId,
              status: "confirmed",
            })
            .eq("id", payment.reference_id);

          const admins = await supabase.from("profiles").select("user_id").eq("account_type", "admin");
          for (const admin of (admins.data || [])) {
            await supabase.rpc("create_notification", {
              _user_id: admin.user_id,
              _type: "booking_confirmed",
              _title_en: "Payment received for booking",
              _title_ar: "تم استلام دفعة لحجز",
              _body_en: `$${payment.amount_usd} paid for consulting session`,
              _link: "/admin/bookings",
              _metadata: { booking_id: payment.reference_id, payment_id: payment.id },
            });
          }

          if (payment.user_id) {
            await supabase.rpc("create_notification", {
              _user_id: payment.user_id,
              _type: "booking_confirmed",
              _title_en: "Booking confirmed — payment received",
              _title_ar: "تم تأكيد الحجز — تم استلام الدفعة",
              _body_en: "Your consultation session is confirmed. Check your email for details.",
              _link: "/profile/bookings",
              _metadata: { booking_id: payment.reference_id },
            });
          }

          const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
          const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const email = customerEmail || payment.guest_email;
          if (email) {
            fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SERVICE_KEY}`,
              },
              body: JSON.stringify({
                to: email,
                subject: "Payment confirmed — DevWady Consulting",
                template: "booking_confirmation",
                data: {
                  guest_name: payment.metadata?.guest_name || "there",
                  expert_name: payment.metadata?.expert_name || "our expert",
                  booking_date: payment.metadata?.booking_date || "",
                  start_time: payment.metadata?.start_time || "",
                  end_time: payment.metadata?.end_time || "",
                  amount: `$${payment.amount_usd}`,
                  lang: "en",
                },
              }),
            }).catch((e) => console.error("Email error:", e));
          }
        }

        // Handle course enrollment
        if (payment.reference_type === "course_enrollment" && payment.reference_id && payment.user_id) {
          const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
          const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          fetch(`${SUPABASE_URL}/functions/v1/process-course-enrollment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SERVICE_KEY}`,
            },
            body: JSON.stringify({
              payment_id: payment.id,
              course_id: payment.reference_id,
              user_id: payment.user_id,
            }),
          }).catch((e) => console.error("Course enrollment error:", e));
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        await supabase
          .from("payments")
          .update({ status: "cancelled" })
          .eq("stripe_session_id", session.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;
        await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent_id", paymentIntentId);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Webhook error", { status: 500 });
  }
});
