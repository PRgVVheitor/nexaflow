import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import React from "react";
import { forwardRef } from "react";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-emerald-400 text-zinc-950 hover:bg-emerald-300",
        secondary: "border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800",
        ghost: "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
        destructive:
          "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
      },
      size: {
        default: "h-10",
        icon: "size-10 p-0",
        sm: "h-9 min-h-9 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  asChild = false,
  className,
  size,
  variant,
  ...props
}) {
  const Component = asChild ? Slot : "button";
  return (
    <Component className={cn(buttonVariants({ size, variant }), className)} {...props} />
  );
}

export function Card({ className, ...props }) {
  return (
    <section
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-xl shadow-black/10",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn("text-base font-semibold text-zinc-50", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm leading-6 text-zinc-400", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-zinc-700 bg-zinc-950/60 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:border-red-400 aria-[invalid=true]:focus:ring-red-400/15",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ className, ...props }, ref) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-zinc-700 bg-zinc-950/60 px-3 text-sm text-zinc-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:border-red-400 aria-[invalid=true]:focus:ring-red-400/15",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

const badgeVariants = cva(
  "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
  {
    variants: {
      variant: {
        default: "border-sky-400/20 bg-sky-400/10 text-sky-300",
        success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
        danger: "border-red-400/20 bg-red-400/10 text-red-300",
        neutral: "border-zinc-700 bg-zinc-800 text-zinc-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("border-b border-zinc-800", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "border-b border-zinc-800/80 transition-colors hover:bg-zinc-800/40",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "h-11 px-3 text-left text-xs font-semibold uppercase text-zinc-500",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return <td className={cn("px-3 py-3.5 text-zinc-300", className)} {...props} />;
}
