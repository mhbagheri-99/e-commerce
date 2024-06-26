"use client";

import { createPaymentIntent } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDiscountedPrice } from "@/lib/couponHelpers";
import { formatCurrency, formatDiscountCode } from "@/lib/formatters";
import { DiscountCodeType, Product } from "@prisma/client";
import {
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

type CheckoutFormProps = {
  product: Product;
  discountCode?: {
    id: string;
    discountType: DiscountCodeType;
    discountAmount: number;
  };
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string,
);

const CheckoutForm = ({
  product,
  discountCode,
}: CheckoutFormProps) => {
  const amount = discountCode == null ? product.priceInCents : getDiscountedPrice(product.priceInCents, discountCode);
  const isDiscounted = amount !== product.priceInCents;

  return (
    <div className="max-w-5xl w-full mx-auto space-y-8">
      <div className="flex gap-4 items-center">
        <div className="aspect-video flex-shrink-0 w-1/3 relative">
          <Image src={product.imagePath} fill alt={product.name} />
        </div>
        <div>
          <div className="text-lg flex gap-4 items-baseline">
            <div
              className={
                isDiscounted ? "line-through text-muted-foreground text-sm" : ""
              }
            >
              {formatCurrency(product.priceInCents / 100)}
            </div>
            {isDiscounted && (
              <div className="">{formatCurrency(amount / 100)}</div>
            )}
          </div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="line-clamp-3 text-muted-foreground">
            {product.description}
          </div>
        </div>
      </div>
      <Elements options={{ amount, mode: "payment", currency: "usd" }} stripe={stripePromise}>
        <Form
          priceInCents={amount}
          productId={product.id}
          discountCode={discountCode}
        />
      </Elements>
    </div>
  );
};

export default CheckoutForm;

const Form = ({
  priceInCents,
  productId,
  discountCode,
}: {
  priceInCents: number;
  productId: string;
  discountCode?: {
    id: string;
    discountType: DiscountCodeType;
    discountAmount: number;
  };
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [email, setEmail] = useState<string>();
  const couponRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const coupon = searchParams.get("coupon");

  const handlePayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements || !email) {
      return;
    }

    setIsLoading(true);

    const formSubmit = await elements.submit();
    
    if (formSubmit.error) {
      setErrorMessage(formSubmit.error.message);
      setIsLoading(false);
      return;
    }

    const paymentIntent = await createPaymentIntent(email, productId, discountCode?.id);

    if (paymentIntent.error) {
      setErrorMessage(paymentIntent.error);
      setIsLoading(false);
      return;
    }

    const clientSecret = paymentIntent.clientSecret;

    if (!clientSecret) {
      setErrorMessage("Stripe failed to create payment intent properly");
      setIsLoading(false);
      return;
    }

    stripe
      .confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/stripe/purchase-success`,
        },
        clientSecret: clientSecret,
      })
      .then(({ error }) => {
        if (error.type === "card_error" || error.type === "validation_error") {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("An unexpected error occurred");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <form onSubmit={handlePayment}>
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription className="text-destructive">
            {errorMessage && <div>{errorMessage}</div>}
            {coupon && discountCode == null && <div>Coupon not found</div>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentElement />
          <div className="mt-4">
            <LinkAuthenticationElement
              onChange={(e) => {
                setEmail(e.value.email);
              }}
            />
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="coupon">Coupon</Label>
            <div className="flex gap-4 items-center">
              <Input
                id="coupon"
                type="text"
                name="coupon"
                className="max-w-xs w-full"
                defaultValue={coupon || ""}
                ref={couponRef}
              />
              <Button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("coupon", couponRef.current?.value || "");
                  router.push(`${pathname}?${params.toString()}`);
                }}
              >
                Apply Coupon
              </Button>
              {discountCode && (
                <div className="text-muted-foreground">
                  -{formatDiscountCode(discountCode)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            disabled={stripe == null || elements == null || isLoading}
          >
            {isLoading
              ? "Purchasing..."
              : `Purchase - ${formatCurrency(priceInCents / 100)}`}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
