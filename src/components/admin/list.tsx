"use client";

/*
 * The one list pattern every admin tab uses:
 *  - search across the record's text + id (debounced, "/" to focus)
 *  - single-choice filters with live counts (faceted: each count respects the other filters)
 *  - dependent filters (e.g. System only lists the chosen Subject's systems)
 *  - sort, pagination, row selection + bulk actions
 *  - state kept in the URL so refresh, back and shared links keep the view; named saved views
 */

import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Search, X } from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import { Btn, IconBtn, Input, toast } from "./ui";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef<T> {
  key: string;
  label: string;
  options: FilterOption[] | ((ctx: { values: Record<string, string> }) => FilterOption[]);
  match: (row: T, value: string) => boolean;
  /** Clear this filter when the named filter changes (dependent filters). */
  dependsOn?: string;
}

export interface ListConfig<T> {
  /** Key for saved views. */
  id: string;
  rows: T[];
  search: (row: T) => string;
  filters: FilterDef<T>[];
  sorts: Record<string, { label: string; value: (row: T) => string | number }>;
  defaultSort: { key: string; dir: "asc" | "desc" };
  pageSize?: number;
}

export interface ListState<T> {
  config: ListConfig<T>;
  q: string;
  setQ: (q: string) => void;
  values: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  sort: { key: string; dir: "asc" | "desc" };
  setSort: (key: string) => void;
  page: number;
  setPage: (p: number) => void;
  size: number;
  setSize: (n: number) => void;
  /** Rows after search + filters + sort (all pages). */
  filtered: T[];
  /** Rows on the current page. */
  visible: T[];
  pages: number;
  /** count[filterKey][optionValue] given every other active filter. */
  facets: Record<string, Record<string, number>>;
  active: boolean;
  clear: () => void;
  query: string;
  apply: (query: string) => void;
}

const SIZES = [25, 50, 100];
const NO_VIEWS: never[] = [];

export function useList<T>(config: ListConfig<T>): ListState<T> {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [q, setQLocal] = useState(urlQ);
  const values: Record<string, string> = {};
  for (const f of config.filters) values[f.key] = params.get(f.key) ?? "";
  const sort = { key: params.get("sort") ?? config.defaultSort.key, dir: (params.get("dir") as "asc" | "desc") ?? config.defaultSort.dir };
  const size = Number(params.get("size")) || config.pageSize || 25;

  const write = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  // Debounce typing into the URL.
  const qRef = useRef(q);
  useEffect(() => {
    qRef.current = q;
    if (q === urlQ) return;
    const t = setTimeout(() => qRef.current === q && write({ q: q || null, page: null }), 200);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  // Back/forward or a saved view changed the URL: sync the box (state adjusted during render, no effect).
  const [seenUrlQ, setSeenUrlQ] = useState(urlQ);
  if (seenUrlQ !== urlQ) {
    setSeenUrlQ(urlQ);
    setQLocal(urlQ);
  }

  const term = urlQ.trim().toLowerCase();
  const words = term.split(/\s+/).filter(Boolean);
  const hay = useMemo(() => new Map(config.rows.map((r) => [r, config.search(r).toLowerCase()])), [config]);
  const searched = useMemo(() => (words.length ? config.rows.filter((r) => words.every((w) => hay.get(r)!.includes(w))) : config.rows), [config.rows, hay, term]); // eslint-disable-line react-hooks/exhaustive-deps

  const valuesKey = JSON.stringify(values);
  const passes = (r: T, except?: string) => config.filters.every((f) => f.key === except || !values[f.key] || f.match(r, values[f.key]));
  const filtered = useMemo(() => {
    const s = config.sorts[sort.key] ?? config.sorts[config.defaultSort.key];
    const out = searched.filter((r) => passes(r));
    if (s) {
      out.sort((a, b) => {
        const x = s.value(a);
        const y = s.value(b);
        const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" });
        return sort.dir === "asc" ? c : -c;
      });
    }
    return out;
  }, [searched, valuesKey, sort.key, sort.dir]); // eslint-disable-line react-hooks/exhaustive-deps

  const facets = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    for (const f of config.filters) {
      const opts = typeof f.options === "function" ? f.options({ values }) : f.options;
      const base = searched.filter((r) => passes(r, f.key));
      out[f.key] = Object.fromEntries(opts.map((o) => [o.value, base.filter((r) => f.match(r, o.value)).length]));
    }
    return out;
  }, [searched, valuesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const page = Math.min(pages, Math.max(1, Number(params.get("page")) || 1));
  const visible = filtered.slice((page - 1) * size, page * size);
  const active = Boolean(urlQ) || config.filters.some((f) => values[f.key]);

  return {
    config,
    q,
    setQ: setQLocal,
    values,
    setFilter: (key, value) => {
      const patch: Record<string, string | null> = { [key]: value || null, page: null };
      for (const f of config.filters) if (f.dependsOn === key) patch[f.key] = null;
      write(patch);
    },
    sort,
    setSort: (key) => write({ sort: key, dir: sort.key === key && sort.dir === "asc" ? "desc" : "asc", page: null }),
    page,
    setPage: (p) => write({ page: p > 1 ? String(p) : null }),
    size,
    setSize: (n) => write({ size: String(n), page: null }),
    filtered,
    visible,
    pages,
    facets,
    active,
    clear: () => {
      setQLocal("");
      write(Object.fromEntries([["q", null], ["page", null], ...config.filters.map((f) => [f.key, null])]));
    },
    query: params.toString(),
    apply: (query) => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }),
  };
}

/* ------------------------------------------------------------------ */
/* Toolbar                                                             */
/* ------------------------------------------------------------------ */

function Popover({ open, onClose, children, align = "left", className }: { open: boolean; onClose: () => void; children: ReactNode; align?: "left" | "right"; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.parentElement?.contains(e.target as Node) && onClose();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className={clsx("absolute top-full z-30 mt-1 w-64 rounded-lg border border-line bg-white p-1 shadow-lg", align === "right" ? "right-0" : "left-0", className)}>
      {children}
    </div>
  );
}

function FilterMenu<T>({ list, filter }: { list: ListState<T>; filter: FilterDef<T> }) {
  const [open, setOpen] = useState(false);
  const [find, setFind] = useState("");
  const value = list.values[filter.key];
  const opts = typeof filter.options === "function" ? filter.options({ values: list.values }) : filter.options;
  const counts = list.facets[filter.key] ?? {};
  const current = opts.find((o) => o.value === value);
  const shown = find ? opts.filter((o) => o.label.toLowerCase().includes(find.toLowerCase())) : opts;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={clsx(
          "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm transition-colors",
          value ? "border-primary bg-primary-light text-primary" : "border-line bg-white text-ink hover:border-faint",
        )}
      >
        <span className={clsx(!value && "text-muted")}>
          {filter.label}
          {current && ":"}
        </span>
        {current && <span className="-ml-0.5 max-w-[160px] truncate font-semibold">{current.label}</span>}
        <ChevronDown className="size-3.5 opacity-70" />
      </button>
      <Popover open={open} onClose={() => (setOpen(false), setFind(""))}>
        {opts.length > 8 && (
          <div className="p-1">
            <Input value={find} onChange={(e) => setFind(e.target.value)} placeholder={`Find ${filter.label.toLowerCase()}…`} autoFocus className="h-8" />
          </div>
        )}
        <div className="max-h-72 overflow-auto">
          <button
            type="button"
            onClick={() => (list.setFilter(filter.key, ""), setOpen(false))}
            className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-primary-light"
          >
            <span className="text-muted">Any {filter.label.toLowerCase()}</span>
            {!value && <Check className="size-4 text-primary" />}
          </button>
          {shown.map((o) => {
            const n = counts[o.value] ?? 0;
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => (list.setFilter(filter.key, o.value), setOpen(false), setFind(""))}
                className={clsx("flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-primary-light", !n && value !== o.value && "text-muted")}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                <span className="text-xs text-muted tabular-nums">{n}</span>
                {value === o.value && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
          {!shown.length && <p className="px-2 py-3 text-center text-sm text-muted">No matches</p>}
        </div>
      </Popover>
    </div>
  );
}

function SavedViews<T>({ list }: { list: ListState<T> }) {
  const views = useAdminStore((s) => s.savedViews[list.config.id]) ?? NO_VIEWS;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const save = () => {
    const n = name.trim();
    if (!n) return;
    useAdminStore.getState().saveView(list.config.id, { name: n, query: list.query.replace(/(^|&)page=\d+/, "") });
    setName("");
    toast(`Saved view “${n}”`);
  };
  return (
    <div className="relative">
      <Btn onClick={() => setOpen(!open)} aria-expanded={open}>
        <Bookmark className="size-4" />
        Views{views.length ? ` (${views.length})` : ""}
      </Btn>
      <Popover open={open} onClose={() => setOpen(false)} align="right" className="w-72">
        <div className="max-h-60 overflow-auto">
          {views.map((v) => (
            <div key={v.name} className="group flex items-center gap-1 rounded hover:bg-primary-light">
              <button type="button" onClick={() => (list.apply(v.query), setOpen(false))} className="min-w-0 flex-1 cursor-pointer truncate px-2 py-1.5 text-left text-sm">
                {v.name}
              </button>
              <IconBtn label={`Delete view ${v.name}`} onClick={() => useAdminStore.getState().deleteView(list.config.id, v.name)} className="size-7 opacity-0 group-hover:opacity-100">
                <X className="size-3.5" />
              </IconBtn>
            </div>
          ))}
          {!views.length && <p className="px-2 py-2 text-sm text-muted">No saved views yet. Set filters, then save them here.</p>}
        </div>
        <div className="mt-1 flex gap-1 border-t border-line p-1 pt-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} placeholder="Name this view" className="h-8" />
          <Btn variant="primary" className="h-8" onClick={save} disabled={!name.trim() || !list.active}>
            Save
          </Btn>
        </div>
      </Popover>
    </div>
  );
}

export function ListToolbar<T>({ list, placeholder, extra }: { list: ListState<T>; placeholder: string; extra?: ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) && !el.isContentEditable) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          ref={input}
          value={list.q}
          onChange={(e) => list.setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-9 w-full rounded-md border border-line bg-white pr-14 pl-9 text-sm text-ink outline-none placeholder:text-faint hover:border-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-light)]"
        />
        {list.q ? (
          <IconBtn label="Clear search" onClick={() => list.setQ("")} className="absolute top-1/2 right-1 size-7 -translate-y-1/2">
            <X className="size-3.5" />
          </IconBtn>
        ) : (
          <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-line bg-background px-1.5 text-xs text-muted">/</kbd>
        )}
      </div>
      {list.config.filters.map((f) => (
        <FilterMenu key={f.key} list={list} filter={f} />
      ))}
      {list.active && (
        <Btn variant="ghost" onClick={list.clear}>
          Clear all
        </Btn>
      )}
      <div className="ml-auto flex items-center gap-2">
        {extra}
        <SavedViews list={list} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

export interface Column<T> {
  key: string;
  label: ReactNode;
  /** Key in config.sorts; makes the header clickable. */
  sort?: string;
  render: (row: T) => ReactNode;
  className?: string;
  headClassName?: string;
}

export function useSelection(ids: string[]) {
  const [raw, setSelected] = useState<Set<string>>(new Set());
  // Only ids still in the list count (filters changed, rows deleted).
  const selected = new Set([...raw].filter((id) => ids.includes(id)));
  return {
    selected,
    toggle: (id: string) =>
      setSelected((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    setMany: (list: string[], on: boolean) =>
      setSelected((s) => {
        const n = new Set(s);
        list.forEach((id) => (on ? n.add(id) : n.delete(id)));
        return n;
      }),
    clear: () => setSelected(new Set()),
  };
}

export function TickBox({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={(e) => (e.stopPropagation(), onChange())}
      className={clsx(
        "flex size-4 cursor-pointer items-center justify-center rounded border transition-colors",
        checked || indeterminate ? "border-primary bg-primary text-white" : "border-faint bg-white hover:border-primary",
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
      {indeterminate && !checked && <span className="h-0.5 w-2 rounded bg-white" />}
    </button>
  );
}

export function DataTable<T>({
  list,
  columns,
  rowId,
  onRowClick,
  selection,
  empty,
  rowClassName,
  scroll,
}: {
  /** Keep the rows in a fixed-height box that scrolls (header stays visible). */
  scroll?: boolean;
  list: ListState<T>;
  columns: Column<T>[];
  rowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  selection?: ReturnType<typeof useSelection>;
  empty: ReactNode;
  rowClassName?: (row: T) => string | undefined;
}) {
  const pageIds = list.visible.map(rowId);
  const allOn = pageIds.length > 0 && pageIds.every((id) => selection?.selected.has(id));
  const someOn = pageIds.some((id) => selection?.selected.has(id));
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className={scroll ? "max-h-[60dvh] overflow-auto" : "overflow-x-auto"}>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="sticky top-0 z-[1] bg-background">
            <tr className="border-b border-line text-left">
              {selection && (
                <th className="w-10 px-3 py-2.5">
                  <TickBox checked={allOn} indeterminate={someOn} onChange={() => selection.setMany(pageIds, !allOn)} label="Select all on this page" />
                </th>
              )}
              {columns.map((c) => {
                const on = c.sort && list.sort.key === c.sort;
                return (
                  <th key={c.key} className={clsx("px-3 py-2.5 text-xs font-semibold tracking-wide text-muted uppercase", c.headClassName)}>
                    {c.sort ? (
                      <button type="button" onClick={() => list.setSort(c.sort!)} className={clsx("inline-flex cursor-pointer items-center gap-1 uppercase hover:text-primary", on && "text-primary")}>
                        {c.label}
                        {on ? <ChevronDown className={clsx("size-3.5", list.sort.dir === "asc" && "rotate-180")} /> : <ChevronsUpDown className="size-3.5 opacity-50" />}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {list.visible.map((row) => {
              const id = rowId(row);
              const on = selection?.selected.has(id);
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(row)}
                  className={clsx("border-b border-line last:border-0", onRowClick && "cursor-pointer", on ? "bg-primary-light" : "hover:bg-background", rowClassName?.(row))}
                >
                  {selection && (
                    <td className="w-10 px-3 py-2.5">
                      <TickBox checked={Boolean(on)} onChange={() => selection.toggle(id)} label="Select row" />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={clsx("px-3 py-2.5 align-middle text-ink", c.className)}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!list.visible.length && empty}
      <Pagination list={list} />
    </div>
  );
}

function Pagination<T>({ list }: { list: ListState<T> }) {
  const total = list.filtered.length;
  if (!total) return null;
  const from = (list.page - 1) * list.size + 1;
  const to = Math.min(total, list.page * list.size);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2 text-sm text-muted">
      <span>
        {from}–{to} of {total}
        {list.config.rows.length !== total && <span> (filtered from {list.config.rows.length})</span>}
      </span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1">
          Rows
          <select value={list.size} onChange={(e) => list.setSize(Number(e.target.value))} className="h-8 cursor-pointer rounded border border-line bg-white px-1 text-ink">
            {SIZES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <IconBtn label="Previous page" disabled={list.page <= 1} onClick={() => list.setPage(list.page - 1)}>
          <ChevronLeft className="size-4" />
        </IconBtn>
        <span className="tabular-nums">
          {list.page} / {list.pages}
        </span>
        <IconBtn label="Next page" disabled={list.page >= list.pages} onClick={() => list.setPage(list.page + 1)}>
          <ChevronRight className="size-4" />
        </IconBtn>
      </div>
    </div>
  );
}

/** Sticky bar shown while rows are selected. */
export function BulkBar({ count, onClear, children }: { count: number; onClear: () => void; children: ReactNode }) {
  if (!count) return null;
  return (
    <div className="animate-fade-in sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary-light px-3 py-2">
      <span className="text-sm font-semibold text-primary">{count} selected</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <Btn variant="ghost" className="ml-auto" onClick={onClear}>
        Clear selection
      </Btn>
    </div>
  );
}

/** Two empty states: nothing exists yet vs. nothing matches the filters. */
export function ListEmpty<T>({ list, noun, onCreate }: { list: ListState<T>; noun: string; onCreate?: () => void }) {
  return list.config.rows.length === 0 ? (
    <div className="px-6 py-14 text-center">
      <p className="text-base font-semibold text-ink">No {noun} yet</p>
      {onCreate && (
        <Btn variant="primary" className="mt-3" onClick={onCreate}>
          Add the first one
        </Btn>
      )}
    </div>
  ) : (
    <div className="px-6 py-14 text-center">
      <p className="text-base font-semibold text-ink">No {noun} match these filters</p>
      <Btn variant="ghost" className="mt-2" onClick={list.clear}>
        Clear search and filters
      </Btn>
    </div>
  );
}

/* Common filter definitions */
export const statusFilter = <T extends { status: string }>(): FilterDef<T> => ({
  key: "status",
  label: "Status",
  options: [
    { value: "published", label: "Published" },
    { value: "draft", label: "Draft" },
    { value: "archived", label: "Archived" },
  ],
  match: (r, v) => r.status === v,
});

export const accessFilter = <T extends { access: string }>(): FilterDef<T> => ({
  key: "access",
  label: "Access",
  options: [
    { value: "free", label: "Free" },
    { value: "premium", label: "Premium" },
  ],
  match: (r, v) => r.access === v,
});

/** `?edit=<id>` (or `?edit=new`) opens a record's editor without leaving the list; deep-linkable. */
export function useEditParam(param = "edit") {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const set = (v: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(param, v);
    else next.delete(param);
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };
  return { id: params.get(param), open: (id: string) => set(id), close: () => set(null) };
}
