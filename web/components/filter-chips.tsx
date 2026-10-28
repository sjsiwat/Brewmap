"use client";

import type { ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import type { DrinkType } from "@/lib/cafes";
import { dataLabel, format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import {
  activeFilterCount,
  distanceLabel,
  distancePresets,
  drinkTypes,
  isPricePreset,
  parsePriceKey,
  priceKey,
  priceLabel,
  pricePresets,
  type FinderFilters,
} from "@/lib/finder-filters";

const chipBase =
  "inline-flex shrink-0 items-stretch border text-sm transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-rust";
const chipOff = "border-line bg-paper-raised text-ink hover:border-ink";
const chipOn = "border-ink bg-ink text-paper";

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={format(t.filters.remove, { label })}
      className="flex items-center self-stretch pr-3 pl-1.5 opacity-80 hover:opacity-100 focus-visible:outline-none"
    >
      <X size={14} aria-hidden />
    </button>
  );
}

/** A chip that opens the native picker (keyboard and mobile friendly); ✕ clears it when set. */
function SelectChip({
  name,
  value,
  current,
  options,
  onChange,
  onClear,
}: {
  name: string;
  value: string;
  /** What's chosen, or null for "any". */
  current: string | null;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  return (
    <span className={`${chipBase} ${current ? chipOn : chipOff}`}>
      <span className={`relative flex items-center gap-1.5 py-2 pl-3.5 ${current ? "pr-0.5" : "pr-3"}`}>
        <span aria-hidden>{current ?? name}</span>
        <ChevronDown size={13} className={current ? "text-paper/70" : "text-muted"} aria-hidden />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={current ? `${name}: ${current}` : name}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
        >
          <option value="">{format(t.filters.any, { name: name.toLowerCase() })}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
      {current && <RemoveButton label={`${name} ${current}`} onClick={onClear} />}
    </span>
  );
}

function ToggleChip({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={`${chipBase} items-center gap-1.5 px-3.5 py-2 ${on ? chipOn : chipOff}`}
    >
      {label}
      {on && <X size={14} className="opacity-80" aria-hidden />}
    </button>
  );
}

/** A filter only the AI sets (tag, area, café name): shown so it can be removed. */
function ValueChip({ children, label, onRemove }: { children: ReactNode; label: string; onRemove: () => void }) {
  return (
    <span className={`${chipBase} ${chipOn}`}>
      <span className="flex items-center py-2 pl-3.5">{children}</span>
      <RemoveButton label={label} onClick={onRemove} />
    </span>
  );
}

/** One horizontal row of filters; it scrolls sideways on small screens. */
export function FilterChips({
  filters,
  onChange,
}: {
  filters: FinderFilters;
  /** Changes to apply (undefined removes a filter), or null to clear them all. */
  onChange: (patch: Partial<FinderFilters> | null) => void;
}) {
  const { t: dict } = useI18n();
  const t = dict.filters;
  const set = onChange;
  const price = { minPrice: filters.minPrice, maxPrice: filters.maxPrice };
  const currentPrice = priceLabel(price, t);
  const priceOptions = pricePresets.map((p) => ({ value: priceKey(p), label: t[p.label] }));
  // A range the AI chose that isn't a preset stays selectable, so the picker shows it.
  if (currentPrice && !isPricePreset(price)) {
    priceOptions.unshift({ value: priceKey(price), label: currentPrice });
  }
  const distances = [...new Set([...distancePresets, ...(filters.radiusKm ? [filters.radiusKm] : [])])].sort(
    (a, b) => a - b,
  );
  const count = activeFilterCount(filters);

  return (
    <div
      role="group"
      aria-label={t.group}
      className="-mx-6 flex items-center gap-2 overflow-x-auto px-6 py-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
    >
      <SelectChip
        name={t.price}
        value={currentPrice ? priceKey(price) : ""}
        current={currentPrice}
        options={priceOptions}
        onChange={(value) => set(value ? parsePriceKey(value) : { minPrice: undefined, maxPrice: undefined })}
        onClear={() => set({ minPrice: undefined, maxPrice: undefined })}
      />
      <SelectChip
        name={t.distance}
        value={filters.radiusKm ? String(filters.radiusKm) : ""}
        current={filters.radiusKm ? distanceLabel(filters.radiusKm, t) : null}
        options={distances.map((km) => ({ value: String(km), label: distanceLabel(km, t) }))}
        onChange={(value) => set({ radiusKm: value ? Number(value) : undefined })}
        onClear={() => set({ radiusKm: undefined })}
      />
      <ToggleChip
        label={t.openNow}
        on={!!filters.openNow}
        onToggle={() => set({ openNow: filters.openNow ? undefined : true })}
      />
      <ToggleChip
        label={t.parking}
        on={!!filters.parking}
        onToggle={() => set({ parking: filters.parking ? undefined : true })}
      />
      <ToggleChip
        label={t.petFriendly}
        on={!!filters.petFriendly}
        onToggle={() => set({ petFriendly: filters.petFriendly ? undefined : true })}
      />
      <SelectChip
        name={t.drink}
        value={filters.drinkType ?? ""}
        current={filters.drinkType ? t.drinkTypes[filters.drinkType] : null}
        options={drinkTypes.map((type) => ({ value: type, label: t.drinkTypes[type] }))}
        onChange={(value) => set({ drinkType: (value || undefined) as DrinkType | undefined })}
        onClear={() => set({ drinkType: undefined })}
      />
      {filters.tag && (
        <ValueChip label={dataLabel(dict.cafeTags, filters.tag)} onRemove={() => set({ tag: undefined })}>
          {dataLabel(dict.cafeTags, filters.tag)}
        </ValueChip>
      )}
      {filters.area && (
        <ValueChip
          label={format(t.areaLabel, { area: dataLabel(dict.areas, filters.area) })}
          onRemove={() => set({ area: undefined })}
        >
          {dataLabel(dict.areas, filters.area)}
        </ValueChip>
      )}
      {filters.q && (
        <ValueChip label={format(t.nameLabel, { q: filters.q })} onRemove={() => set({ q: undefined })}>
          {format(t.nameChip, { q: filters.q })}
        </ValueChip>
      )}
      {count > 0 && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 px-2 py-2 text-sm text-rust underline-offset-4 hover:underline focus-ring"
        >
          {t.clearAll}
        </button>
      )}
    </div>
  );
}
