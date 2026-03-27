"use client";
import React from "react";

export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
      {title && (
        <h3 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h3>
      )}
      {children}
    </div>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  defaultChecked,
}: {
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  defaultChecked?: boolean;
}) {
  const [internal, setInternal] = React.useState(defaultChecked ?? false);
  const isControlled = checked !== undefined;
  const value = isControlled ? checked : internal;
  const handleChange = (v: boolean) => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };

  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group">
      <div>
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
      <div
        onClick={() => handleChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          value ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value?: string;
  onChange?: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm text-gray-700 dark:text-gray-300">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
