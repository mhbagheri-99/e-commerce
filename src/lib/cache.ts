import { unstable_cache as NextCache } from "next/cache";
import { cache as ReactCache } from "react";

type Callback = (...args: any[]) => Promise<any>;

export function cache<T extends Callback>(
  callback: T,
  keyParts: string[],
  options: { revalidate?: number | false; tags?: string[] } = {},
) {
  return NextCache(ReactCache(callback), keyParts, options);
}
