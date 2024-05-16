import db from "../../../db/db";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import React from "react";
import PurchaseReceipt from "@/email/PurchaseReceipt";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const resend = new Resend(process.env.RESEND_API_KEY as string);

export const POST = async (req: NextRequest) => {
  const event = await stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get("stripe-signature") as string,
    process.env.STRIPE_WEBHOOK_SECRET as string,
  );

  if (event.type === "charge.succeeded") {
    const charge = event.data.object as Stripe.Charge;
    const productId = charge.metadata.productId;
    const email = charge.billing_details.email;
    console.log("EMAIL: ", email);
    const totalInCents = charge.amount;

    const product = await db.product.findUnique({ where: { id: productId } });

    if (!product || !email) {
      return new NextResponse("Order not found", { status: 400 });
    }

    const userData = {
      email,
      orders: {
        create: {
          productId,
          totalInCents,
        },
      },
    };

    const {
      orders: [order],
    } = await db.user.upsert({
      where: { email },
      update: userData,
      create: userData,
      select: { orders: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    const downloadVerification = await db.downloadVerification.create({
      data: {
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        productId,
      },
    });

    await resend.emails.send({
      from: `Support <${process.env.RESEND_DOMAIN}>`,
      to: email,
      subject: "Your order is ready",
      react: (
        <PurchaseReceipt
          order={order}
          product={product}
          downloadVerificationId={downloadVerification.id}
        />
      ),
    });
  }
  return new NextResponse();
};
