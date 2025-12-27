import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input, Pagination, Space, Tabs, Typography, message } from "antd";
import { SearchOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import apiClient from "@/services/apiClient";
import type { DictItem } from "@/components/DictRemoteSelect";

const { Text } = Typography;

type DictSearchResponse = {
  set_code: string;
  query: string;
  page: number;
  page_size: number;
  total: number;
  items: DictItem[];
};

type DictUserItemsResponse = {
  set_code: string;
  items: DictItem[];
};

type TabKey = "search" | "recent" | "favorite";

type Props = {
  setCode?: string | null;
  targetLabel?: string | null;
  onApplyItem: (item: DictItem) => void;
};

const SEARCH_PAGE_SIZE = 20;
const RECENT_LIMIT = 50;
const FAVORITE_LIMIT = 200;

function normalizeCode(value: string | null | undefined): string {
  return (value || "").trim();
}

export default function DictSearchPanel({ setCode, targetLabel, onApplyItem }: Props) {
  const normalizedSetCode = normalizeCode(setCode);
  const hasTarget = Boolean(normalizedSetCode) && Boolean(targetLabel);

  const [tab, setTab] = useState<TabKey>("search");

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchItems, setSearchItems] = useState<DictItem[]>([]);
  const debounceRef = useRef<number | null>(null);

  const [recentLoading, setRecentLoading] = useState(false);
  const [recents, setRecents] = useState<DictItem[]>([]);

  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favorites, setFavorites] = useState<DictItem[]>([]);

  const favoriteCodeSet = useMemo(() => new Set(favorites.map((it) => normalizeCode(it.code))), [favorites]);

  const loadRecents = async () => {
    if (!normalizedSetCode) return;
    setRecentLoading(true);
    try {
      const resp = await apiClient.get<DictUserItemsResponse>(`/dicts/${normalizedSetCode}/recents`, {
        params: { limit: RECENT_LIMIT },
        withCredentials: true,
      });
      setRecents(resp.data.items || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "加载最近使用失败";
      message.error(msg);
      setRecents([]);
    } finally {
      setRecentLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!normalizedSetCode) return;
    setFavoriteLoading(true);
    try {
      const resp = await apiClient.get<DictUserItemsResponse>(`/dicts/${normalizedSetCode}/favorites`, {
        params: { limit: FAVORITE_LIMIT },
        withCredentials: true,
      });
      setFavorites(resp.data.items || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "加载常用收藏失败";
      message.error(msg);
      setFavorites([]);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const fetchSearch = async (nextQuery: string, nextPage: number) => {
    if (!normalizedSetCode) return;
    setSearchLoading(true);
    try {
      const resp = await apiClient.get<DictSearchResponse>(`/dicts/${normalizedSetCode}/search`, {
        params: { q: nextQuery, page: nextPage, page_size: SEARCH_PAGE_SIZE },
        withCredentials: true,
      });
      setSearchItems(resp.data.items || []);
      setSearchTotal(Number(resp.data.total || 0));
      setPage(Number(resp.data.page || nextPage));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "检索失败";
      message.error(msg);
      setSearchItems([]);
      setSearchTotal(0);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    setQuery("");
    setPage(1);
    setSearchItems([]);
    setSearchTotal(0);
    setRecents([]);
    setFavorites([]);
    if (!normalizedSetCode) return;
    void loadRecents();
    void loadFavorites();
  }, [normalizedSetCode]);

  useEffect(() => {
    if (!normalizedSetCode) return;
    if (tab !== "search") return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void fetchSearch(query.trim(), 1);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [normalizedSetCode, tab, query]);

  const markRecent = async (code: string) => {
    if (!normalizedSetCode) return;
    const normalized = normalizeCode(code);
    if (!normalized) return;
    try {
      await apiClient.post(`/dicts/${normalizedSetCode}/recents/${encodeURIComponent(normalized)}`, null, {
        withCredentials: true,
      });
    } catch {
      // ignore
    }
  };

  const toggleFavorite = async (item: DictItem) => {
    if (!normalizedSetCode) return;
    const code = normalizeCode(item.code);
    if (!code) return;
    const nextFavorited = !favoriteCodeSet.has(code);
    try {
      await apiClient.put(
        `/dicts/${normalizedSetCode}/favorites/${encodeURIComponent(code)}`,
        { favorited: nextFavorited },
        { withCredentials: true },
      );
      void loadFavorites();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "更新收藏失败";
      message.error(msg);
    }
  };

  const applyItem = async (item: DictItem) => {
    if (!hasTarget) return;
    onApplyItem(item);
    await markRecent(item.code);
    void loadRecents();
  };

  const renderItemRow = (item: DictItem) => {
    const code = normalizeCode(item.code);
    const name = normalizeCode(item.name);
    const isFav = favoriteCodeSet.has(code);
    return (
      <div
        key={code || name}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 8,
          alignItems: "center",
          padding: "6px 8px",
          borderRadius: 6,
          border: "1px solid rgba(15,23,42,0.06)",
          background: "#fff",
          cursor: hasTarget ? "pointer" : "not-allowed",
          opacity: hasTarget ? 1 : 0.6,
        }}
        onClick={() => {
          void applyItem(item);
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Text code style={{ marginRight: 8 }}>
            {code || "-"}
          </Text>
          <Text style={{ fontSize: 13 }}>{name || "-"}</Text>
        </div>
        <Button
          type="text"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            void toggleFavorite(item);
          }}
          disabled={!normalizedSetCode}
          title={isFav ? "取消收藏" : "收藏为常用"}
        >
          {isFav ? <StarFilled style={{ color: "#FAAD14" }} /> : <StarOutlined />}
        </Button>
      </div>
    );
  };

  const tabItems = [
    {
      key: "search",
      label: "搜索",
      children: (
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder={normalizedSetCode ? "按编码/名称模糊检索" : "请先在左侧选择回填目标"}
            disabled={!normalizedSetCode}
          />
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {searchItems.map(renderItemRow)}
            {!searchItems.length && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {searchLoading ? "加载中..." : "暂无数据"}
              </Text>
            )}
          </Space>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Pagination
              size="small"
              current={page}
              pageSize={SEARCH_PAGE_SIZE}
              total={searchTotal}
              showSizeChanger={false}
              onChange={(nextPage) => {
                setPage(nextPage);
                void fetchSearch(query.trim(), nextPage);
              }}
              disabled={!normalizedSetCode}
            />
          </div>
        </Space>
      ),
    },
    {
      key: "recent",
      label: "最近使用",
      children: (
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {recents.map(renderItemRow)}
            {!recents.length && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {recentLoading ? "加载中..." : "暂无数据"}
              </Text>
            )}
          </Space>
        </Space>
      ),
    },
    {
      key: "favorite",
      label: "常用收藏",
      children: (
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {favorites.map(renderItemRow)}
            {!favorites.length && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {favoriteLoading ? "加载中..." : "暂无数据"}
              </Text>
            )}
          </Space>
        </Space>
      ),
    },
  ] as const;

  return (
    <Card
      size="small"
      title={
        <Space direction="vertical" size={0}>
          <Text strong>远程字典检索</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {hasTarget ? `目标：${targetLabel}` : "请先点击左侧表格行（编码/名称）选定回填目标"}
          </Text>
        </Space>
      }
      bodyStyle={{ padding: 12 }}
      style={{ borderRadius: 10 }}
    >
      <Tabs activeKey={tab} onChange={(k) => setTab(k as TabKey)} items={tabItems as any} />
    </Card>
  );
}

