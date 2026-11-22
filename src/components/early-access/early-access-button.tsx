import Link from "next/link";
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Primary call to action. Links to the early-access page. */
export function EarlyAccessButton({
  source,
  children = "Request early access",
  ...props
}: Omit<ButtonProps, "asChild" | "children"> & {
  /** Where the request started, recorded with the submission. */
  source: string;
  children?: ReactNode;
}) {
  return (
    <Button asChild {...props}>
      <Link href={{ pathname: "/early-access", query: { source } }}>{children}</Link>
    </Button>
  );
}
