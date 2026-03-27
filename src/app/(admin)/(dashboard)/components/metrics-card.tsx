import Badge from "@/components/ui/badge/Badge";
import { ArrowDown, ArrowUp, LucideIcon } from "lucide-react";

export const MetricsCard = ({
  Icon,
  title,
  value,
  shift,
  subtitle,
}: {
  Icon: LucideIcon;
  title: string;
  value: number;
  shift?: number;
  subtitle?: string;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
        <Icon className="text-gray-800 size-6 dark:text-white/90" />
      </div>

      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {value.toLocaleString()}
          </h4>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {shift !== undefined && (
          <Badge color={shift > 0 ? "success" : "error"}>
            {shift > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(shift)}%
          </Badge>
        )}
      </div>
    </div>
  );
};
