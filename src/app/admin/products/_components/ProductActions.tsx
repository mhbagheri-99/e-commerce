"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTransition } from "react";
import { deleteProduct, setProductAvailability } from "../../_actions/products";
import { useRouter } from "next/navigation";

export const ActiveToggleDropdownItem = ({
  id,
  isAvailable,
}: {
  id: string;
  isAvailable: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <DropdownMenuItem
      onClick={() => {
        startTransition(async () => {
          await setProductAvailability(id, !isAvailable);
          router.refresh();
        });
      }}
      disabled={isPending}
    >
      {isAvailable ? "Deactivate" : "Activate"}
    </DropdownMenuItem>
  );
};

export const DeleteDropdownItem = ({
  id,
  disabled,
}: {
  id: string;
  disabled: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <DropdownMenuItem
      onClick={() => {
        startTransition(async () => {
          await deleteProduct(id);
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
