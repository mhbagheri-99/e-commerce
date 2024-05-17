import db from "@/db/db";
import { notFound } from "next/navigation";
import Stripe from "stripe";
import CheckoutForm from "./_components/CheckoutForm";
import { usableCouponWhere } from "@/lib/couponHelpers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const ProductPurchasePage = async ({
  params: { id },
  searchParams: { coupon },
}: {
  params: { id: string };
  searchParams: { coupon?: string };
}) => {
  const product = await db.product.findUnique({
    where: { id },
  });

  if (!product) {
    return notFound();
  }

  const discountCode = coupon ? await getDiscountCode(coupon, id) : undefined;

  return <CheckoutForm product={product} discountCode={discountCode} />;
};

export default ProductPurchasePage;

const getDiscountCode = async (code: string, productId: string) => {
  const discountCode = await db.discountCode.findUnique({
    select: { id: true, discountType: true, discountAmount: true },
    where: { ...usableCouponWhere(productId), code },
  });

  if (!discountCode) {
    return undefined;
  }

  return discountCode;
};
