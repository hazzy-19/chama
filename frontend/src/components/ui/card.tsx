import * as React from "react";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={twMerge(
      "rounded-[2rem] border border-slate-200/80 bg-surface p-8 shadow-soft",
      className
    )}
    {...props}
  />
));

Card.displayName = "Card";

export { Card };
