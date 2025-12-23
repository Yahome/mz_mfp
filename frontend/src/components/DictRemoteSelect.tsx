import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Select } from "antd";
import apiClient from "@/services/apiClient";

export type DictItem = {
  code: string;
  name: string;
  item_type?: string | null;
  select_optional?: string | null;
};

type LabelMode = "code_name" | "name";

type DictSearchResponse = {
  set_code: string;
  query: string;
  page: number;
  page_size: number;
  total: number;
  items: DictItem[];
};

type Props = {
  setCode: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
  onSelectItem?: (item: DictItem) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  style?: CSSProperties;
  status?: "error" | "warning";
  labelMode?: LabelMode;
  resolveValueLabel?: boolean;
};

const resolvedItemCache = new Map<string, DictItem>();

export default function DictRemoteSelect({
  setCode,
  value,
  onChange,
  onSelectItem,
  placeholder,
  disabled,
  allowClear,
  style,
  status,
  labelMode = "code_name",
  resolveValueLabel = false,
}: Props) {
  const normalizedValue = value === undefined || value === null ? undefined : String(value).trim();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Array<{ value: string; label: string; item: DictItem }>>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const [resolvedTick, setResolvedTick] = useState(0);

  const pageSize = 30;

  const formatLabel = (item: DictItem) => {
    if (labelMode === "name") return item.name;
    return `${item.code} ${item.name}`.trim();
  };

  const fetchPage = async (nextQuery: string, nextPage: number) => {
    setLoading(true);
    try {
      const resp = await apiClient.get<DictSearchResponse>(`/dicts/${setCode}/search`, {
        params: { q: nextQuery, page: nextPage, page_size: pageSize },
        withCredentials: true,
      });
      const newOptions = resp.data.items.map((item) => ({
        value: item.code,
        label: formatLabel(item),
        item,
      }));

      if (nextPage === 1) {
        setOptions(newOptions);
      } else {
        setOptions((prev) => {
          const seen = new Set(prev.map((o) => o.value));
          const merged = [...prev];
          for (const opt of newOptions) {
            if (!seen.has(opt.value)) merged.push(opt);
          }
          return merged;
        });
      }
      const loaded = nextPage * pageSize;
      setHasMore(loaded < resp.data.total);
      setPage(resp.data.page);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOptions([]);
    setPage(1);
    setHasMore(false);
    setQuery("");
  }, [setCode]);

  useEffect(() => {
    if (!resolveValueLabel) return;
    const normalized = normalizedValue ?? "";
    if (!normalized) return;
    if (options.some((opt) => opt.value === normalized)) return;

    const cacheKey = `${setCode}::${normalized}`;
    if (resolvedItemCache.has(cacheKey)) return;

    let cancelled = false;
    (async () => {
      try {
        const resp = await apiClient.get<DictSearchResponse>(`/dicts/${setCode}/search`, {
          params: { q: normalized, page: 1, page_size: 50 },
          withCredentials: true,
        });
        const exact = resp.data.items.find((it) => String(it.code) === normalized) || null;
        if (exact) resolvedItemCache.set(cacheKey, exact);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setResolvedTick((x) => x + 1);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [normalizedValue, options, resolveValueLabel, setCode]);

  const handleSearch = (next: string) => {
    const nextQuery = next.trim();
    setQuery(nextQuery);
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => fetchPage(nextQuery, 1), 250);
  };

  const handlePopupScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const target = e.currentTarget;
    if (!hasMore || loading) return;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 24) {
      void fetchPage(query, page + 1);
    }
  };

  const mergedOptions = useMemo(() => {
    const normalized = normalizedValue ?? "";
    if (!normalized) return options;
    if (options.some((opt) => opt.value === normalized)) return options;
    const cacheKey = `${setCode}::${normalized}`;
    const cached = resolvedItemCache.get(cacheKey);
    if (cached) {
      return [{ value: normalized, label: formatLabel(cached), item: cached }, ...options];
    }
    return [{ value: normalized, label: normalized, item: { code: normalized, name: normalized } }, ...options];
  }, [formatLabel, options, resolvedTick, setCode, normalizedValue]);

  return (
    <Select
      showSearch
      filterOption={false}
      value={normalizedValue}
      disabled={disabled}
      allowClear={allowClear}
      placeholder={placeholder}
      options={mergedOptions}
      loading={loading}
      onSearch={handleSearch}
      onFocus={() => {
        if (!options.length) void fetchPage("", 1);
      }}
      onPopupScroll={handlePopupScroll}
      onChange={(nextValue, option: any) => {
        const normalized = nextValue === undefined || nextValue === null ? undefined : String(nextValue).trim();
        onChange?.(normalized);
        const item = option?.item as DictItem | undefined;
        if (item && normalized) onSelectItem?.(item);
      }}
      style={style}
      status={status}
    />
  );
}
