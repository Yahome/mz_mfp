import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Select } from "antd";
import apiClient from "@/services/apiClient";

export type DictItem = {
  code: string;
  name: string;
  extra_code?: string | null;
  merged_code?: string | null;
};

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
};

export default function DictRemoteSelect({
  setCode,
  value,
  onChange,
  onSelectItem,
  placeholder,
  disabled,
  allowClear,
  style,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Array<{ value: string; label: string; item: DictItem }>>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const pageSize = 30;

  const fetchPage = async (nextQuery: string, nextPage: number) => {
    setLoading(true);
    try {
      const resp = await apiClient.get<DictSearchResponse>(`/dicts/${setCode}/search`, {
        params: { q: nextQuery, page: nextPage, page_size: pageSize },
        withCredentials: true,
      });
      const newOptions = resp.data.items.map((item) => ({
        value: item.code,
        label: `${item.code} ${item.name}`,
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
    if (!value) return options;
    if (options.some((opt) => opt.value === value)) return options;
    return [{ value, label: value, item: { code: value, name: value } }, ...options];
  }, [options, value]);

  return (
    <Select
      showSearch
      filterOption={false}
      value={value}
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
        const normalized = nextValue ? String(nextValue) : undefined;
        onChange?.(normalized);
        const item = option?.item as DictItem | undefined;
        if (item && normalized) onSelectItem?.(item);
      }}
      style={style}
    />
  );
}
