import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/config";
import { getSession, getUserId } from "@/lib/stripe/get-session";
import { getSubscription } from "@/lib/stripe/subscription";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = getUserId(session);
    const subscription = await getSubscription(userId);

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ invoices: [] });
    }

    const stripe = getStripe();

    const stripeInvoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 20,
    });

    const invoices = stripeInvoices.data.map((invoice) => ({
      id: invoice.id,
      date: invoice.created
        ? new Date(invoice.created * 1000).toISOString()
        : new Date().toISOString(),
      amount: invoice.amount_due ?? 0,
      currency: invoice.currency ?? "jpy",
      status: invoice.status ?? "draft",
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      invoicePdf: invoice.invoice_pdf ?? null,
    }));

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("GET /api/stripe/invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}
