"use client";

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import React, { useTransition } from 'react'
import { deleteUser } from '../../_actions/users';

export const DeleteDropDownItem = ({ id }: { id: string }) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteUser(id)
          router.refresh()
        })
      }
    >
      Delete
    </DropdownMenuItem>
  )
}
