"use server";

import db from "@/db/db";
import OrderHistoryEmail from "@/email/OrderHistory";
import { getDiscountedPrice, usableCouponWhere } from "@/lib/couponHelpers";
import { Resend } from "resend";
import { z } from "zod";
import Stripe from "stripe";

const emailSchema = z.string().email();
const resend = new Resend(process.env.RESEND_API_KEY as string);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const emailOrderHistory = async (
  prevState: unknown,
  formData: FormData,
): Promise<{ message?: string; error?: string }> => {
  const result = emailSchema.safeParse(formData.get("email"));

  if (result.success === false) {
    return { error: "Invalid email address" };
  }

  const user = await db.user.findUnique({
    where: { email: result.data },
    select: {
      email: true,
      orders: {
        select: {
          totalInCents: true,
          id: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true,
              imagePath: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (user == null) {
    return {
      message:
        "Check your email to view your order history and download your products.",
    };
  }

  const orders = user.orders.map(async (order) => {
    return {
      ...order,
      downloadVerificationId: (
        await db.downloadVerification.create({
          data: {
            expiresAt: new Date(Date.now() + 24 * 1000 * 60 * 60),
            productId: order.product.id,
          },
        })
      ).id,
    };
  });

  const data = await resend.emails.send({
    from: `Support <${process.env.RESEND_DOMAIN}>`,
    to: user.email,
    subject: "Order History",
    react: <OrderHistoryEmail orders={await Promise.all(orders)} />,
  });

  if (data.error) {
    return {
      error: "There was an error sending your email. Please try again.",
    };
  }

  return {
    message:
      "Check your email to view your order history and download your products.",
  };
};

export const createPaymentIntent = async (
  email: string,
  productId: string,
  discountCodeId?: string,
) => {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, priceInCents: true },
  });

  if (!product) {
    return { error: "Product not found" };
  }

  const discountCode = discountCodeId
    ? await db.discountCode.findUnique({
        where: { id: discountCodeId, ...usableCouponWhere(productId) },
      })
    : undefined;

  if (discountCodeId && !discountCode) {
    return { error: "Invalid discount code" };
  }

  const orderExists = await db.order.findFirst({
      where: {
        user: { email },
        productId,
      },
      select: {
        id: true,
      },
    });

    if (orderExists) {
      return { error: "You have already purchased this product. You can access it in 'My Orders' page." };
    }

  const amount = discountCode ? getDiscountedPrice(product.priceInCents, discountCode) : product.priceInCents;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "USD",
    metadata: {
      productId: product.id,
      discountCodeId: discountCode?.id || null,
    },
  });

  if (!paymentIntent.client_secret) {
    return { error: "Stripe failed to create payment intent properly" };
  }

  return { clientSecret: paymentIntent.client_secret };
};
