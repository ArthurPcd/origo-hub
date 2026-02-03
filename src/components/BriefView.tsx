"use client";

import { ReactNode } from "react";

interface BriefViewProps {
  content: string;
}

export default function BriefView({ content }: BriefViewProps) {
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let listItems: { text: string; ordered: boolean }[] = [];
  let tableRows: string[][] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    const isOrdered = listItems[0].ordered;
    const Tag = isOrdered ? "ol" : "ul";
    elements.push(
      <Tag
        key={key++}
        className={`mb-4 space-y-1.5 sm:space-y-1 ${isOrdered ? "list-decimal ml-5 sm:ml-6" : "ml-3 sm:ml-4"}`}
      >
        {listItems.map((item, i) => (
          <li
            key={i}
            className={`text-foreground/80 text-sm sm:text-base ${!isOrdered ? "flex items-start gap-2" : ""}`}
          >
            {!isOrdered && (
              <span className="text-accent mt-1.5 text-[8px] shrink-0">
                &#9679;
              </span>
            )}
            <span>{renderInline(item.text)}</span>
          </li>
        ))}
      </Tag>
    );
    listItems = [];
  }

  function flushTable() {
    if (tableRows.length === 0) return;
    elements.push(
      <div key={key++} className="overflow-x-auto my-6 -mx-2 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-2 sm:px-0">
          <table className="min-w-full border-collapse border border-edge rounded-lg overflow-hidden">
            <thead className="bg-surface">
              <tr>
                {tableRows[0].map((cell, i) => (
                  <th
                    key={i}
                    className="border border-edge px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={rowIdx % 2 === 0 ? "bg-base" : "bg-surface/50"}
                >
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="border border-edge px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground/80"
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
    tableRows = [];
  }

  function renderInline(text: string): ReactNode[] {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="text-foreground font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect table rows: | col1 | col2 | col3 |
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      // Skip separator rows like |---|---|
      if (cells.every((c) => /^[-:\s]+$/.test(c))) {
        continue;
      }

      flushList();
      tableRows.push(cells);
      continue;
    }

    // If we were building a table and now we're not, flush it
    if (tableRows.length > 0 && !line.trim().startsWith("|")) {
      flushTable();
    }

    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1
          key={key++}
          className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 mt-2 leading-tight"
        >
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={key++}
          className="text-lg sm:text-xl font-semibold text-foreground mt-8 sm:mt-10 mb-2.5 sm:mb-3 leading-tight"
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3
          key={key++}
          className="text-base sm:text-lg font-medium text-foreground mt-5 sm:mt-6 mb-2 leading-tight"
        >
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("#### ")) {
      flushList();
      elements.push(
        <h4
          key={key++}
          className="text-sm sm:text-base font-medium text-foreground/90 mt-4 mb-1.5 leading-tight"
        >
          {line.slice(5)}
        </h4>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push({ text: line.slice(2), ordered: false });
    } else if (/^\d+\.\s/.test(line)) {
      listItems.push({ text: line.replace(/^\d+\.\s/, ""), ordered: true });
    } else if (line === "---") {
      flushList();
      elements.push(<hr key={key++} className="border-edge my-6 sm:my-8" />);
    } else if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
      flushList();
      elements.push(
        <p key={key++} className="text-foreground/80/60 text-xs sm:text-sm italic mb-3">
          {line.slice(1, -1)}
        </p>
      );
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-foreground/80 text-sm sm:text-base mb-3 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  }

  flushList();
  flushTable();

  return <div className="max-w-none">{elements}</div>;
}
