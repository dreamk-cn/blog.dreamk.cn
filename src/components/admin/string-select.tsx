"use client";

import { ListBox, Select } from "@heroui/react";

export type StringSelectOption = { id: string; label: string };

type StringSelectProps = {
  label?: string;
  "aria-label"?: string;
  className?: string;
  options: StringSelectOption[];
  selectedId: string;
  onSelectionChange: (id: string) => void;
};

export function StringSelect({
  label,
  "aria-label": ariaLabel,
  className,
  options,
  selectedId,
  onSelectionChange,
}: StringSelectProps) {
  return (
    <div className={className}>
      {label ? (
        <span className="mb-1 block text-small font-bold text-text-muted">{label}</span>
      ) : null}
      <Select
        aria-label={ariaLabel ?? label}
        className="w-full text-text-base"
        value={selectedId}
        onChange={(key) => {
          if (key === null) return;
          onSelectionChange(String(key));
        }}
      >
        <Select.Trigger className="text-text-muted">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {options.map((o) => (
              <ListBox.Item className="text-text-base" key={o.id} id={o.id} textValue={o.label}>
                {o.label}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}
