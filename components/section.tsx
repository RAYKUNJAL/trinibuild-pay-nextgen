import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  eyebrow,
  title,
  description,
  children,
  className,
  containerClassName,
  id,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
}) {
  const hasHeader = Boolean(eyebrow || title || description);
  return (
    <section id={id} className={cn("py-12 md:py-20", className)}>
      <div className={cn("container", containerClassName)}>
        {hasHeader ? (
          <header className="mx-auto max-w-2xl text-center">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-red">{eyebrow}</p>
            ) : null}
            {title ? (
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-3 text-base text-muted-foreground">{description}</p>
            ) : null}
          </header>
        ) : null}
        <div className={cn(hasHeader && "mt-10 md:mt-12")}>{children}</div>
      </div>
    </section>
  );
}
