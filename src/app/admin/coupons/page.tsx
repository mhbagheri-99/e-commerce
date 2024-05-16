import React from "react";
import PageHeader from "../_components/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import db from "@/db/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Globe,
  Infinity,
  Minus,
  MoreVertical,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Prisma } from "@prisma/client";
import { formatDateTime, formatDiscountCode } from "@/lib/formatters";
import {
  ActiveToggleDropdownItem,
  DeleteDropdownItem,
} from "./_components/CouponActions";

const WHERE_EXPIRED: Prisma.DiscountCodeWhereInput = {
  OR: [
    { limit: { not: null, lte: db.discountCode.fields.used } },
    { expiresAt: { not: null, lte: new Date() } },
  ],
};

const SELECT_FIELDS: Prisma.DiscountCodeSelect = {
  id: true,
  allProducts: true,
  code: true,
  discountAmount: true,
  discountType: true,
  expiresAt: true,
  limit: true,
  used: true,
  isActive: true,
  products: { select: { name: true } },
  _count: { select: { orders: true } },
};

const getExpiredCoupons = async () => {
  const result = await db.discountCode.findMany({
    select: SELECT_FIELDS,
    where: WHERE_EXPIRED,
    orderBy: { createdAt: "asc" },
  });
  return result;
};

const getNotExpiredCoupons = async () => {
  const result = await db.discountCode.findMany({
    select: SELECT_FIELDS,
    where: { NOT: WHERE_EXPIRED },
    orderBy: { createdAt: "asc" },
  });
  return result;
};

const CouponsPage = async () => {
  const [expiredCoupons, notExpiredCoupons] = await Promise.all([
    getExpiredCoupons(),
    getNotExpiredCoupons(),
  ]);
  return (
    <>
      <div className="flex justify-between items-center gap-4">
        <PageHeader>Discount Codes</PageHeader>
        <Button>
          <Link href="/admin/coupons/create">Add Coupon</Link>
        </Button>
      </div>
      <CouponsTable discountCodes={notExpiredCoupons} canDeactivate />
      <div className="mt-8">
        <h2 className="text-xl font-bold">Expired Coupons</h2>
        <CouponsTable discountCodes={expiredCoupons} isInactive />
      </div>
    </>
  );
};

export default CouponsPage;

type DiscountCodesTableProps = {
  discountCodes: Awaited<ReturnType<typeof getNotExpiredCoupons>>;
  isInactive?: boolean;
  canDeactivate?: boolean;
};

const CouponsTable = async ({
  discountCodes,
  isInactive = false,
  canDeactivate = false,
}: DiscountCodesTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-0">
            <span className="sr-only">Is Active</span>
          </TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Discount</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>Remaining Uses</TableHead>
          <TableHead>Orders</TableHead>
          <TableHead>Discounted Products</TableHead>
          <TableHead className="w-0">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {discountCodes.map((coupon) => (
          <TableRow key={coupon.id}>
            <TableCell>
              {coupon.isActive && !isInactive ? (
                <>
                  <span className="sr-only">Active</span>
                  <CheckCircle2 size={24} className="stroke-green-700" />
                </>
              ) : (
                <>
                  <span className="sr-only">Inactive</span>
                  <XCircle size={24} className="stroke-destructive" />
                </>
              )}
            </TableCell>
            <TableCell>{coupon.code}</TableCell>
            <TableCell>{formatDiscountCode(coupon)}</TableCell>
            <TableCell>
              {coupon.expiresAt == null ? (
                <Minus />
              ) : (
                formatDateTime(coupon.expiresAt)
              )}
            </TableCell>
            <TableCell>
              {coupon.limit == null ? <Infinity /> : coupon.limit - coupon.used}
            </TableCell>
            <TableCell>{coupon._count.orders}</TableCell>
            <TableCell>
              {coupon.allProducts ? (
                <Globe />
              ) : (
                coupon.products.map((p) => p.name).join(", ")
              )}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <span className="sr-only">Actions</span>
                  <MoreVertical size={24} />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {canDeactivate && (
                    <>
                      <ActiveToggleDropdownItem
                        id={coupon.id}
                        isActive={coupon.isActive}
                      />
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DeleteDropdownItem
                    id={coupon.id}
                    disabled={coupon._count.orders > 0}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
