/* Componentes visuais no estilo shadcn/ui, usados pelo app original. */
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";

const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm";
};

const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  outline: "border bg-white/70 hover:bg-muted shadow-sm",
  ghost: "hover:bg-muted",
  destructive: "bg-destructive text-white hover:bg-destructive/90 shadow-sm",
};

export function Button({ variant = "default", size = "default", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors cursor-pointer",
        "disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        size === "sm" ? "h-8 px-3" : "h-9 px-4 py-2",
        buttonVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export const Card = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-xl border bg-card shadow-sm", className)} {...p} />
);
export const CardHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 p-6", className)} {...p} />
);
export const CardTitle = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("font-semibold leading-none", className)} {...p} />
);
export const CardDescription = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("text-sm text-muted-foreground", className)} {...p} />
);
export const CardContent = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 pb-6", className)} {...p} />
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-9 w-full min-w-0 rounded-md border bg-white/80 px-3 py-1 text-sm shadow-sm outline-none",
      "placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring",
      "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:opacity-50",
      className,
    )}
    {...p}
  />
));

export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn(
      "flex h-9 w-full rounded-md border bg-white/80 px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      className,
    )}
    {...p}
  />
);

export const Label = ({ className, ...p }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-sm font-medium leading-none", className)} {...p} />
);

export function Badge({ variant = "default", className, ...p }: HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "outline" }) {
  const styles = {
    default: "bg-primary text-primary-foreground border-transparent",
    secondary: "bg-secondary text-secondary-foreground border-transparent",
    outline: "text-foreground",
  };
  return (
    <span
      className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap", styles[variant], className)}
      {...p}
    />
  );
}

export const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={cn("relative w-full overflow-hidden rounded-full bg-primary/20", className)}>
    <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

export const Table = ({ children }: { children: ReactNode }) => (
  <div className="relative w-full overflow-x-auto">
    <table className="w-full caption-bottom text-sm">{children}</table>
  </div>
);
export const THead = (p: HTMLAttributes<HTMLTableSectionElement>) => <thead className="[&_tr]:border-b" {...p} />;
export const TBody = (p: HTMLAttributes<HTMLTableSectionElement>) => <tbody className="[&_tr:last-child]:border-0" {...p} />;
export const Tr = ({ className, ...p }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b transition-colors hover:bg-muted/50", className)} {...p} />
);
export const Th = ({ className, ...p }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("h-10 px-2 text-left align-middle font-medium whitespace-nowrap", className)} {...p} />
);
export const Td = ({ className, ...p }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("p-2 align-middle", className)} {...p} />
);

/** Badge da situação cadastral: ATIVA em azul escuro, o resto em azul claro (como no original). */
export const SituacaoBadge = ({ situacao }: { situacao: string }) => (
  <Badge variant={situacao.toUpperCase() === "ATIVA" ? "default" : "secondary"}>{situacao || "-"}</Badge>
);
