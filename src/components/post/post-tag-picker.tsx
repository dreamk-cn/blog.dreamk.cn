"use client";

import type { Key } from "@heroui/react";
import {
  Autocomplete,
  Description,
  EmptyState,
  Label,
  ListBox,
  SearchField,
  Tag,
  TagGroup,
  useFilter,
} from "@heroui/react";
import type { Tag as TagModel } from "@/generated/prisma";
import { normalizeSlug } from "@/lib/slug";
import { useMemo, useState } from "react";

export type FormTag = Pick<TagModel, "id" | "name" | "slug"> & { isNew?: boolean };

const CREATE_PREFIX = "__create__:";
const CREATE_ITEM_ID = "__create__";

type PostTagPickerProps = {
  catalogTags: Partial<TagModel>[];
  value: FormTag[];
  onChange: (tags: FormTag[]) => void;
  disabled?: boolean;
};

function isTempTagId(id: string) {
  return id.startsWith("temp-");
}

export function PostTagPicker({ catalogTags, value, onChange, disabled }: PostTagPickerProps) {
  const { contains } = useFilter({ sensitivity: "base" });
  const [filterText, setFilterText] = useState("");

  const catalogItems = useMemo(
    () =>
      catalogTags.filter((tag): tag is TagModel & { id: string; name: string } =>
        Boolean(tag.id && tag.name),
      ),
    [catalogTags],
  );

  const allItems = useMemo(() => {
    const map = new Map<string, FormTag>();
    for (const tag of catalogItems) {
      map.set(tag.id, { id: tag.id, name: tag.name, slug: tag.slug });
    }
    for (const tag of value) {
      map.set(tag.id, tag);
    }
    return Array.from(map.values());
  }, [catalogItems, value]);

  const selectedKeys = value.map((tag) => tag.id);

  function tagsFromKeys(keys: Key[]) {
    const next: FormTag[] = [];

    for (const key of keys) {
      const keyStr = String(key);

      if (keyStr.startsWith(CREATE_PREFIX)) {
        const name = keyStr.slice(CREATE_PREFIX.length).trim();
        if (!name) continue;

        const existingCatalog = catalogItems.find(
          (tag) => tag.name.toLowerCase() === name.toLowerCase(),
        );
        if (existingCatalog) {
          if (!next.some((tag) => tag.id === existingCatalog.id)) {
            next.push({ id: existingCatalog.id, name: existingCatalog.name, slug: existingCatalog.slug });
          }
          continue;
        }

        const existingSelected = value.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
        if (existingSelected) {
          if (!next.some((tag) => tag.id === existingSelected.id)) {
            next.push(existingSelected);
          }
          continue;
        }

        next.push({
          id: `temp-${Date.now()}-${next.length}`,
          name,
          slug: normalizeSlug(name, 50),
          isNew: true,
        });
        continue;
      }

      const item = allItems.find((tag) => tag.id === keyStr);
      if (item && !next.some((tag) => tag.id === item.id)) {
        next.push(item);
      }
    }

    return next;
  }

  function handleChange(keys: Key | Key[] | null) {
    const query = filterText.trim();
    const normalized = (Array.isArray(keys) ? keys : keys ? [keys] : []).map((key) =>
      String(key) === CREATE_ITEM_ID ? `${CREATE_PREFIX}${query}` : key,
    );
    onChange(tagsFromKeys(normalized));
    setFilterText("");
  }

  function handleRemoveTags(keys: Set<Key>) {
    onChange(value.filter((tag) => !keys.has(tag.id)));
  }

  const trimmedFilter = filterText.trim();
  const showCreateOption =
    trimmedFilter.length > 0 &&
    !allItems.some((tag) => tag.name.toLowerCase() === trimmedFilter.toLowerCase());

  return (
    <Autocomplete
      allowsEmptyCollection
      className="w-full"
      isDisabled={disabled}
      placeholder="搜索或输入标签…"
      selectionMode="multiple"
      value={selectedKeys}
      onChange={handleChange}
    >
      <Label className="text-sm text-text-muted">文章标签</Label>
      <Description className="text-xs">可多选已有标签，或输入新标签名创建</Description>
      <Autocomplete.Trigger>
        <Autocomplete.Value>
          {({ defaultChildren, isPlaceholder, state }) => {
            if (isPlaceholder || state.selectedItems.length === 0) {
              return defaultChildren;
            }

            return (
              <TagGroup size="sm" onRemove={handleRemoveTags}>
                <TagGroup.List>
                  {value.map((tag) => (
                    <Tag key={tag.id} id={tag.id}>
                      {tag.name}
                      {tag.isNew || isTempTagId(tag.id) ? " · 新建" : ""}
                    </Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            );
          }}
        </Autocomplete.Value>
        <Autocomplete.ClearButton />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter filter={contains} inputValue={filterText} onInputChange={setFilterText}>
          <SearchField autoFocus name="tag-search" variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="搜索标签…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox
            renderEmptyState={() => (
              <EmptyState className="text-sm text-text-muted">
                {trimmedFilter ? `回车或点击创建「${trimmedFilter}」` : "暂无匹配标签"}
              </EmptyState>
            )}
          >
            {allItems.map((tag) => (
              <ListBox.Item key={tag.id} id={tag.id} textValue={tag.name}>
                {tag.name}
                {tag.isNew || isTempTagId(tag.id) ? (
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
    </Autocomplete>
  );
}
