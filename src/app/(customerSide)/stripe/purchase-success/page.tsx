import { Button } from "@/components/ui/button";
import db from "@/db/db";
import { formatCurrency } from "@/lib/formatters";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const SuccessPaymentPage = async ({
  searchParams,
}: {
  searchParams: { payment_intent: string };
}) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(
    searchParams.payment_intent,
  );

  const isSuccessful = paymentIntent.status === "succeeded";

  if (!paymentIntent.metadata.productId) {
    return notFound();
  }

  const product = await db.product.findUnique({
    where: { id: paymentIntent.metadata.productId },
  });

  if (!product) {
    return notFound();
  }

  return (
    <div className="max-w-5xl w-full mx-auto space-y-8">
      <h1 className="text-4xl font-bold">
        {isSuccessful ? "Paid Successfully :D" : "Payment Failed :("}
      </h1>
      <div className="flex gap-4 items-center">
        <div className="aspect-video flex-shrink-0 w-1/3 relative">
          <Image src={product.imagePath} fill alt={product.name} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="line-clamp-3 text-muted-foreground">
            {product.description}
          </div>
          <Button className="mt-4" size="lg" asChild>
            {isSuccessful ? (
              <a
                href={`/products/download/${await createDownloadVerification(product.id)}`}
              >
                Download
              </a>
            ) : (
              <Link href={`/products/${product.id}/purchase`}>Retry</Link>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPaymentPage;

const createDownloadVerification = async (productId: string) => {
  return (
    await db.downloadVerification.create({
      data: {
        productId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    })
  ).id;
};
