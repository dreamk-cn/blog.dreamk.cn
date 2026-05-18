"use client";

import type { DateValue } from "@internationalized/date";
import type { TimeValue } from "@heroui/react";
import {
  Calendar,
  DateField,
  DatePicker,
  Description,
  FieldError,
  Label,
  TimeField,
} from "@heroui/react";
import { fromDate, getLocalTimeZone, now } from "@internationalized/date";
import { useMemo } from "react";

function toStoredValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function storedValueToDateValue(value: string): DateValue | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return fromDate(date, getLocalTimeZone());
}

function dateValueToStoredValue(value: DateValue | null) {
  if (!value) return "";
  return toStoredValue(value.toDate(getLocalTimeZone()));
}

export function nowPublishedAtValue() {
  return dateValueToStoredValue(now(getLocalTimeZone()));
}

type PublishedAtPickerProps = {
  value: string;
  onChange: (value: string) => void;
  isInvalid?: boolean;
  errorMessage?: string;
};

export function PublishedAtPicker({ value, onChange, isInvalid, errorMessage }: PublishedAtPickerProps) {
  const dateValue = useMemo(() => storedValueToDateValue(value), [value]);

  return (
    <DatePicker
      className="w-full"
      granularity="minute"
      hourCycle={24}
      isRequired
      isInvalid={isInvalid}
      value={dateValue}
      onChange={(next) => onChange(dateValueToStoredValue(next))}
    >
      {({ state }) => (
        <>
          <Label className="text-text-muted">发布日期</Label>
          <Description>用于前台展示与文章排序，使用本地时区</Description>
          <DateField.Group fullWidth>
            <DateField.Input className="text-text-base">
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
            <DateField.Suffix>
              <DatePicker.Trigger>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
          <DatePicker.Popover className="flex flex-col gap-3">
            <Calendar aria-label="发布日期" className="text-text-muted">
              <Calendar.Header>
                <Calendar.YearPickerTrigger>
                  <Calendar.YearPickerTriggerHeading />
                  <Calendar.YearPickerTriggerIndicator />
                </Calendar.YearPickerTrigger>
                <Calendar.NavButton slot="previous" />
                <Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
              </Calendar.Grid>
              <Calendar.YearPickerGrid>
                <Calendar.YearPickerGridBody>
                  {({ year }) => <Calendar.YearPickerCell year={year} />}
                </Calendar.YearPickerGridBody>
              </Calendar.YearPickerGrid>
            </Calendar>
            <div className="flex items-center justify-between gap-3 px-3 pb-3">
              <Label className="text-text-muted">时间</Label>
              <TimeField
                aria-label="发布时间"
                granularity="minute"
                hourCycle={24}
                value={state.timeValue}
                onChange={(next) => state.setTimeValue(next as TimeValue)}
              >
                <TimeField.Group variant="secondary">
                  <TimeField.Input className="text-text-base">
                    {(segment) => <TimeField.Segment segment={segment} />}
                  </TimeField.Input>
                </TimeField.Group>
              </TimeField>
            </div>
          </DatePicker.Popover>
        </>
      )}
    </DatePicker>
  );
}
