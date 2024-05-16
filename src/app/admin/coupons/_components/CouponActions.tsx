"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteCoupon,
  setCouponAvailability,
} from "../../_actions/discountCodes";

export const ActiveToggleDropdownItem = ({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <DropdownMenuItem
      onClick={() => {
        startTransition(async () => {
          await setCouponAvailability(id, !isActive);
          router.refresh();
        });
      }}
      disabled={isPending}
    >
      {isActive ? "Deactivate" : "Activate"}
    </DropdownMenuItem>
  );
};

export const DeleteDropdownItem = ({
  id,
  disabled,
}: {
  id: string;
  disabled?: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <DropdownMenuItem
      onClick={() => {
        startTransition(async () => {
          await deleteCoupon(id);
          router.refresh();
        });
      }}
      disabled={isPending || disabled}
      variant="destructive"
    >
      Delete
    </DropdownMenuItem>
  );
};
