import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, onClick, disabled, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const [pending, setPending] = React.useState(false);
  const handleClick = (event) => {
    if (pending || disabled) { event.preventDefault(); return; }
    try {
      const result = onClick?.(event);
      if (result && typeof result.then === "function") {
        setPending(true);
        return Promise.resolve(result).catch(error => window.dispatchEvent(new CustomEvent("pkos:action-error", { detail: { message: error.message || "That action could not be saved. Please retry." } }))).finally(() => setPending(false));
      }
      return result;
    } catch (error) { window.dispatchEvent(new CustomEvent("pkos:action-error", {detail:{message:error.message||"Please try that action again."}})); }
  };
  return (
    (<Comp
      data-variant={variant || "default"}
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
      onClick={handleClick}
      disabled={disabled || pending}
      aria-busy={pending || props["aria-busy"] || undefined}>
      {asChild ? children : <>{pending && <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" />}{children}</>}
    </Comp>)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
