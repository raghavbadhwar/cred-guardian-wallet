import { cn } from "@/lib/utils";

export type CredentialStatus = "valid" | "expired" | "revoked" | "pending";

interface StatusBadgeProps {
  status: CredentialStatus;
  className?: string;
}

const statusConfig = {
  valid: {
    label: "Verified",
    className: "bg-success-bg text-success border-success/20"
  },
  expired: {
    label: "Expired", 
    className: "bg-warning-bg text-warning border-warning/20"
  },
  revoked: {
    label: "Revoked",
    className: "bg-danger-bg text-danger border-danger/20"
  },
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground border-border"
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-fast",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}