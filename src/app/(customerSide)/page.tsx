import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import db from "@/db/db";
import { cache } from "@/lib/cache";
import { Product } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const getMostPopularProducts = cache(
  async () => {
    return await db.product.findMany({
      where: { isAvailable: true },
      orderBy: { orders: { _count: "desc" } },
      take: 6,
    });
  },
  ["/", "most-popular-products"],
  { revalidate: 60 * 60 * 24 },
);

const getRecentlyAddedProducts = cache(
  async () => {
    return await db.product.findMany({
      where: { isAvailable: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  },
  ["/", "recently-added-products"],
  { revalidate: 60 * 60 * 24 },
);

const HomePage = () => {
  return (
    <main className="space-y-12">
      <ProductGridSection
        title="Most Popular"
        productsRetriever={getMostPopularProducts}
      />
      <ProductGridSection
        title="Recently Added"
        productsRetriever={getRecentlyAddedProducts}
      />
    </main>
  );
};

export default HomePage;

const ProductGridSection = ({
  title,
  productsRetriever,
}: {
  title: string;
  productsRetriever: () => Promise<Product[]>;
}) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <h2 className="text-3xl font-bold">{title}</h2>
        <Button asChild variant="outline">
          <Link href={"/products"} className="space-x-2">
            <span>View All</span>
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Suspense
          fallback={
            <>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </>
          }
        >
          <ProductSuspense productsRetriever={productsRetriever} />
        </Suspense>
      </div>
    </div>
  );
};

const ProductSuspense = async ({
  productsRetriever,
}: {
  productsRetriever: () => Promise<Product[]>;
}) => {
  return (await productsRetriever()).map((product) => (
    <ProductCard key={product.id} {...product} />
  ));
};
