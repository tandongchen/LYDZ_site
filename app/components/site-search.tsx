"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { GAME_CATALOG } from "../games/catalog";

type SearchEntry = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  keywords: string;
};

const PAGE_ENTRIES: readonly SearchEntry[] = [
  {
    id: "home",
    title: "魔法数学首页",
    eyebrow: "HOME",
    description: "返回魔法数学主视觉与星系入口。",
    href: "/#top",
    keywords: "首页 魔法数学 magic math 星系 logo",
  },
  {
    id: "projects",
    title: "启动全域征程",
    eyebrow: "PROJECT INDEX",
    description: "浏览派对社交、策略博弈与逻辑解谜三类游戏。",
    href: "/#projects",
    keywords: "游戏入口 全部游戏 分类 派对 社交 策略 博弈 逻辑 解谜",
  },
  {
    id: "featured",
    title: "精选项目档案",
    eyebrow: "SELECTED WORKS",
    description: "查看精选游戏画面与项目介绍。",
    href: "/#featured",
    keywords: "精选 项目 档案 游戏画面",
  },
  {
    id: "about",
    title: "设计方法",
    eyebrow: "DESIGN PRINCIPLE",
    description: "了解数学游戏的设计原则。",
    href: "/#about",
    keywords: "关于 设计 方法 数学 规则 反馈",
  },
  {
    id: "rules",
    title: "游戏规则详解",
    eyebrow: "RULE ARCHIVE",
    description: "集中阅读九款游戏的完整玩法与关键策略。",
    href: "/rules",
    keywords: "规则 玩法 教程 目标 策略",
  },
  {
    id: "contact",
    title: "合作联系",
    eyebrow: "CONTACT",
    description: "分享游戏灵感、规则构想与合作计划。",
    href: "/contact",
    keywords: "联系 邮箱 合作 灵感 规则 问题",
  },
];

const SEARCH_ENTRIES: readonly SearchEntry[] = [
  ...GAME_CATALOG.map((game) => ({
    id: game.id,
    title: game.title,
    eyebrow: `GAME · ${game.number}`,
    description: game.description,
    href: game.href,
    keywords: `${game.title} ${game.category} ${game.description} ${game.group}`,
  })),
  ...PAGE_ENTRIES,
];

type FindCapableWindow = Window & {
  find?: (
    query: string,
    caseSensitive?: boolean,
    backwards?: boolean,
    wrapAround?: boolean,
    wholeWord?: boolean,
    searchInFrames?: boolean,
    showDialog?: boolean,
  ) => boolean;
};

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hasPageMatch, setHasPageMatch] = useState(false);
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
  const results = useMemo(() => {
    if (!normalizedQuery) return SEARCH_ENTRIES.slice(0, 6);
    return SEARCH_ENTRIES.filter((entry) => (
      `${entry.title} ${entry.eyebrow} ${entry.description} ${entry.keywords}`
        .toLocaleLowerCase("zh-CN")
        .includes(normalizedQuery)
    )).slice(0, 8);
  }, [normalizedQuery]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("site-search-is-open");
    inputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("site-search-is-open");
    };
  }, [open]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const pageContains = (value: string) => {
    const normalizedValue = value.trim().toLocaleLowerCase("zh-CN");
    if (normalizedValue.length < 2 || typeof document === "undefined") return false;
    const searchableText = Array.from(
      document.querySelectorAll("main section, main article, main h1, main h2, main h3, main p, main li"),
    ).map((element) => element.textContent ?? "").join(" ").toLocaleLowerCase("zh-CN");
    return searchableText.includes(normalizedValue);
  };

  const openSearch = () => {
    setStatus("");
    setHasPageMatch(pageContains(query));
    setOpen(true);
  };

  const closeSearch = () => {
    setOpen(false);
    setStatus("");
  };

  const findInCurrentPage = (event?: FormEvent) => {
    event?.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    closeSearch();
    window.setTimeout(() => {
      const found = (window as FindCapableWindow).find?.(trimmedQuery, false, false, true, false, true, false) ?? false;
      if (!found) {
        setStatus(`当前页面没有找到“${trimmedQuery}”`);
        setOpen(true);
      }
    }, 80);
  };

  const searchDialog = open ? (
    <div className="site-search-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeSearch();
    }}>
      <section className="site-search-dialog" role="dialog" aria-modal="true" aria-labelledby="site-search-title">
        <div className="site-search-topline">
          <span>MAGIC MATH · GLOBAL SEARCH</span>
          <button type="button" onClick={closeSearch} aria-label="关闭搜索">×</button>
        </div>

        <div className="site-search-heading">
          <small>SEARCH THE ARCHIVE</small>
          <h2 id="site-search-title">搜索整个数学宇宙</h2>
        </div>

        <form className="site-search-form" onSubmit={findInCurrentPage}>
          <span className="site-search-glyph" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              setHasPageMatch(pageContains(nextQuery));
              setStatus("");
            }}
            placeholder="搜索游戏、规则或页面中的文字…"
            aria-label="搜索游戏、规则或页面内容"
          />
          <kbd>CTRL K</kbd>
        </form>

        <div className="site-search-results" aria-live="polite">
          <div className="site-search-results-head">
            <span>{normalizedQuery ? `匹配结果 · ${results.length}` : "快速入口"}</span>
            {hasPageMatch ? (
              <button type="button" onClick={() => findInCurrentPage()}>
                定位当前页面文字 <b aria-hidden="true">↓</b>
              </button>
            ) : null}
          </div>

          {results.length ? (
            <ul>
              {results.map((result) => (
                <li key={result.id}>
                  <Link href={result.href} onClick={closeSearch}>
                    <small>{result.eyebrow}</small>
                    <strong>{result.title}</strong>
                    <span>{result.description}</span>
                    <b aria-hidden="true">↗</b>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="site-search-empty">没有对应的档案。你仍可以按回车，在当前页面中查找这段文字。</p>
          )}
          {status ? <p className="site-search-status">{status}</p> : null}
        </div>
      </section>
    </div>
  ) : null;

  return (
    <>
      <button
        className="studio-search-button"
        type="button"
        onClick={openSearch}
        aria-label="打开全站搜索"
        aria-expanded={open}
      >
        <span className="studio-search-icon" aria-hidden="true" />
        <span>搜索</span>
      </button>
      {open && typeof document !== "undefined" && searchDialog
        ? createPortal(searchDialog, document.body)
        : null}
    </>
  );
}
