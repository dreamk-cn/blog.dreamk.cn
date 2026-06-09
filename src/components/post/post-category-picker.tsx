"use client";

import type { Key } from "@heroui/react";
import {
  Autocomplete,
  Description,
  EmptyState,
  FieldError,
  Label,
  ListBox,
  SearchField,
  useFilter,
} from "@heroui/react";
import type { Category } from "@/generated/prisma";
import { normalizeSlug } from "@/lib/slug";
import { useMemo, useState } from "react";

export type FormCategory = {
  id: string;
  name: string;
  slug: string;
  isNew?: boolean;
};

const NO_CATEGORY_ID = "__none__";
const CREATE_ITEM_ID = "__create__";

type PostCategoryPickerProps = {
  categories: Partial<Category>[];
  value: FormCategory | null;
  onChange: (category: FormCategory | null) => void;
  disabled?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
};

function isTempCategoryId(id: string) {
  return id.startsWith("temp-cat-");
}

export function PostCategoryPicker({
  categories,
  value,
  onChange,
  disabled,
  isInvalid,
  errorMessage,
}: PostCategoryPickerProps) {
  const { contains } = useFilter({ sensitivity: "base" });
  const [filterText, setFilterText] = useState("");

  const catalogItems = useMemo(
    () =>
      categories.filter((category): category is Category & { id: string; name: string } =>
        Boolean(category.id && category.name),
      ),
    [categories],
  );

  const listItems = useMemo(() => {
    const map = new Map<string, FormCategory>();
    for (const category of catalogItems) {
      map.set(category.id, { id: category.id, name: category.name, slug: category.slug });
    }
    if (value && (value.isNew || isTempCategoryId(value.id))) {
      map.set(value.id, value);
    }
    return Array.from(map.values());
  }, [catalogItems, value]);

  const selectedKey = value?.id ?? NO_CATEGORY_ID;

  function commitCustomCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      onChange(null);
      return;
    }

    const existing = catalogItems.find(
      (category) => category.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      onChange({ id: existing.id, name: existing.name, slug: existing.slug });
      return;
    }

    onChange({
      id: `temp-cat-${Date.now()}`,
      name: trimmed,
      slug: normalizeSlug(trimmed, 100),
      isNew: true,
    });
  }

  function handleChange(key: Key | Key[] | null) {
    const nextKey = Array.isArray(key) ? key[0] : key;
    if (!nextKey || nextKey === NO_CATEGORY_ID) {
      onChange(null);
      setFilterText("");
      return;
    }

    const keyStr = String(nextKey);
    if (keyStr === CREATE_ITEM_ID) {
      commitCustomCategory(filterText);
      setFilterText("");
      return;
    }

    const existing = listItems.find((category) => category.id === keyStr);
    if (existing) {
      onChange(existing);
      setFilterText("");
    }
  }

  const trimmedFilter = filterText.trim();
  const showCreateOption =
    trimmedFilter.length > 0 &&
    !listItems.some((category) => category.name.toLowerCase() === trimmedFilter.toLowerCase());

  return (
    <Autocomplete
      allowsEmptyCollection
      className="w-full"
      isDisabled={disabled}
      isInvalid={isInvalid}
      placeholder="搜索或输入分类…"
      selectionMode="single"
      value={selectedKey}
      onChange={handleChange}
    >
      <Label className="text-sm text-text-muted">文章分类</Label>
      <Description className="text-xs">搜索已有分类，或输入新分类名后点击创建</Description>
      <Autocomplete.Trigger>
        <Autocomplete.Value>
          {({ defaultChildren, isPlaceholder }) => {
            if (isPlaceholder || !value) return defaultChildren;
            return (
              <span className="truncate text-sm text-text-base">
                {value.name}
                {value.isNew || isTempCategoryId(value.id) ? (
                  <span className="ml-1 text-xs text-text-muted">· 新建</span>
                ) : null}
              </span>
            );
          }}
        </Autocomplete.Value>
        <Autocomplete.ClearButton />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter filter={contains} inputValue={filterText} onInputChange={setFilterText}>
          <SearchField autoFocus name="category-search" variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="搜索分类…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox
            renderEmptyState={() => (
              <EmptyState className="text-sm text-text-muted">
                {trimmedFilter ? `点击创建「${trimmedFilter}」` : "暂无匹配分类"}
              </EmptyState>
            )}
          >
            <ListBox.Item id={NO_CATEGORY_ID} textValue="无分类">
              无分类
              <ListBox.ItemIndicator />
            </ListBox.Item>
            {listItems.map((category) => (
              <ListBox.Item key={category.id} id={category.id} textValue={category.name}>
                {category.name}
                {category.isNew || isTempCategoryId(category.id) ? (
                  <span className="ml-1 text-xs text-text-muted">新建</span>
                ) : null}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
            {showCreateOption ? (
              <ListBox.Item
                id={CREATE_ITEM_ID}
                textValue={`创建「${trimmedFilter}」`}
                className="text-accent"
              >
                创建「{trimmedFilter}」
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ) : null}
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </Autocomplete>
  );
}
