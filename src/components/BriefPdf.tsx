import { Document, Page, Text, View, Image, StyleSheet, pdf } from "@react-pdf/renderer";
import { Brief } from "@/lib/types";

// ─── Theme System ─────────────────────────────────────────────────────────────

interface PdfThemeConfig {
  accent: string;
  pageBg: string;
  pageText: string;
  titleText: string;
  sectionTitleText: string;
  sectionTitleBorder: string;
  subsectionText: string;
  paragraphText: string;
  listText: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  tableHeaderBorder: string;
  tableBorder: string;
  tableCellBorder: string;
  tableCellText: string;
  gridItemBg: string;
  gridItemBorder: string;
  gridLabelText: string;
  gridValueText: string;
  footerBg: string;
  footerBorder: string;
  footerText: string;
  footerLogo: string;
  footerCopyright: string;
}

export const PDF_THEMES: Record<string, PdfThemeConfig> = {
  classic: {
    accent: "#00D9FF",
    pageBg: "#ffffff",
    pageText: "#2c2c2c",
    titleText: "#1a1a1a",
    sectionTitleText: "#1a1a1a",
    sectionTitleBorder: "#e0e0e0",
    subsectionText: "#333333",
    paragraphText: "#444444",
    listText: "#444444",
    tableHeaderBg: "#f8f9fa",
    tableHeaderText: "#1a1a1a",
    tableHeaderBorder: "#00D9FF",
    tableBorder: "#d0d0d0",
    tableCellBorder: "#e8e8e8",
    tableCellText: "#444444",
    gridItemBg: "#f9f9f9",
    gridItemBorder: "#e5e5e5",
    gridLabelText: "#666666",
    gridValueText: "#1a1a1a",
    footerBg: "#ffffff",
    footerBorder: "#e0e0e0",
    footerText: "#999999",
    footerLogo: "#00D9FF",
    footerCopyright: "#AAAAAA",
  },
  minimal: {
    accent: "#888888",
    pageBg: "#ffffff",
    pageText: "#2c2c2c",
    titleText: "#1a1a1a",
    sectionTitleText: "#333333",
    sectionTitleBorder: "#d0d0d0",
    subsectionText: "#555555",
    paragraphText: "#444444",
    listText: "#444444",
    tableHeaderBg: "#f5f5f5",
    tableHeaderText: "#1a1a1a",
    tableHeaderBorder: "#1a1a1a",
    tableBorder: "#d0d0d0",
    tableCellBorder: "#e8e8e8",
    tableCellText: "#444444",
    gridItemBg: "#f9f9f9",
    gridItemBorder: "#e5e5e5",
    gridLabelText: "#666666",
    gridValueText: "#1a1a1a",
    footerBg: "#ffffff",
    footerBorder: "#e0e0e0",
    footerText: "#999999",
    footerLogo: "#999999",
    footerCopyright: "#CCCCCC",
  },
  dark: {
    accent: "#00D9FF",
    pageBg: "#111111",
    pageText: "#e8e8e8",
    titleText: "#ffffff",
    sectionTitleText: "#ffffff",
    sectionTitleBorder: "#333333",
    subsectionText: "#e0e0e0",
    paragraphText: "#e8e8e8",
    listText: "#e8e8e8",
    tableHeaderBg: "#1e1e1e",
    tableHeaderText: "#00D9FF",
    tableHeaderBorder: "#00D9FF",
    tableBorder: "#333333",
    tableCellBorder: "#222222",
    tableCellText: "#e0e0e0",
    gridItemBg: "#1e1e1e",
    gridItemBorder: "#333333",
    gridLabelText: "#aaaaaa",
    gridValueText: "#e8e8e8",
    footerBg: "#111111",
    footerBorder: "#333333",
    footerText: "#666666",
    footerLogo: "#00D9FF",
    footerCopyright: "#555555",
  },
  executive: {
    accent: "#B8960C",
    pageBg: "#FDFBF7",
    pageText: "#1C1C2E",
    titleText: "#1C1C2E",
    sectionTitleText: "#1C1C2E",
    sectionTitleBorder: "#B8960C",
    subsectionText: "#2D2D4E",
    paragraphText: "#1C1C2E",
    listText: "#1C1C2E",
    tableHeaderBg: "#1C1C2E",
    tableHeaderText: "#F5E6A3",
    tableHeaderBorder: "#B8960C",
    tableBorder: "#D4B896",
    tableCellBorder: "#E8D9C0",
    tableCellText: "#1C1C2E",
    gridItemBg: "#F5F0E8",
    gridItemBorder: "#D4B896",
    gridLabelText: "#7A6A4A",
    gridValueText: "#1C1C2E",
    footerBg: "#FDFBF7",
    footerBorder: "#D4B896",
    footerText: "#9A8A6A",
    footerLogo: "#B8960C",
    footerCopyright: "#C0B090",
  },
  emerald: {
    accent: "#10B981",
    pageBg: "#ffffff",
    pageText: "#1a2e1a",
    titleText: "#064E3B",
    sectionTitleText: "#064E3B",
    sectionTitleBorder: "#A7F3D0",
    subsectionText: "#065F46",
    paragraphText: "#374151",
    listText: "#374151",
    tableHeaderBg: "#F0FDF4",
    tableHeaderText: "#064E3B",
    tableHeaderBorder: "#10B981",
    tableBorder: "#A7F3D0",
    tableCellBorder: "#D1FAE5",
    tableCellText: "#374151",
    gridItemBg: "#F0FDF4",
    gridItemBorder: "#A7F3D0",
    gridLabelText: "#065F46",
    gridValueText: "#064E3B",
    footerBg: "#ffffff",
    footerBorder: "#D1FAE5",
    footerText: "#6EE7B7",
    footerLogo: "#10B981",
    footerCopyright: "#A7F3D0",
  },
};

interface TableData {
  headers: string[];
  rows: string[][];
}

interface ContentBlock {
  type: "paragraph" | "table" | "list" | "heading";
  content: string | TableData | ListData;
  level?: number;
}

interface ListData {
  items: string[];
  ordered: boolean;
}

// Helper to parse inline markdown (bold text)
function parseInlineMarkdown(text: string): Array<{ text: string; bold: boolean }> {
  const parts: Array<{ text: string; bold: boolean }> = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.index), bold: false });
    }
    // Add the bold text
    parts.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), bold: false });
  }

  return parts.length > 0 ? parts : [{ text, bold: false }];
}

// Helper function to detect if a line is part of a markdown table
function isTableLine(line: string): boolean {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

// Helper function to parse markdown table
function parseMarkdownTable(lines: string[]): TableData | null {
  if (lines.length < 2) return null;

  const parseRow = (line: string): string[] => {
    return line
      .trim()
      .split("|")
      .filter((cell) => cell.trim() !== "")
      .map((cell) => cell.trim());
  };

  const headers = parseRow(lines[0]);

  // Skip separator row (line with dashes)
  const dataRows = lines
    .slice(2)
    .filter((line) => isTableLine(line))
    .map((line) => parseRow(line));

  return {
    headers,
    rows: dataRows,
  };
}

// Helper function to split content into blocks with better markdown support
function parseContentBlocks(content: string): ContentBlock[] {
  const lines = content.split("\n");
  const blocks: ContentBlock[] = [];
  let currentParagraph: string[] = [];
  let currentTable: string[] = [];
  let currentList: { items: string[]; ordered: boolean } | null = null;
  let inTable = false;

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      blocks.push({
        type: "paragraph",
        content: currentParagraph.join("\n").trim(),
      });
      currentParagraph = [];
    }
  }

  function flushList() {
    if (currentList && currentList.items.length > 0) {
      blocks.push({
        type: "list",
        content: { items: currentList.items, ordered: currentList.ordered },
      });
      currentList = null;
    }
  }

  function flushTable() {
    if (inTable && currentTable.length > 0) {
      const tableData = parseMarkdownTable(currentTable);
      if (tableData) {
        blocks.push({
          type: "table",
          content: tableData,
        });
      }
      currentTable = [];
      inTable = false;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Handle tables
    if (isTableLine(line)) {
      flushParagraph();
      flushList();
      inTable = true;
      currentTable.push(line);
      continue;
    }

    // If we were in a table, flush it
    if (inTable) {
      flushTable();
    }

    // Handle headings (### subsections)
    if (trimmed.startsWith("###")) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        content: trimmed.replace(/^###\s*/, ""),
        level: 3,
      });
      continue;
    }

    // Handle bullet lists (- or *)
    if (trimmed.match(/^[-*]\s+/)) {
      flushParagraph();
      const itemText = trimmed.replace(/^[-*]\s+/, "");
      if (!currentList || currentList.ordered) {
        currentList = { items: [], ordered: false };
      }
      currentList.items.push(itemText);
      continue;
    }

    // Handle numbered lists (1. 2. etc)
    if (trimmed.match(/^\d+\.\s+/)) {
      flushParagraph();
      const itemText = trimmed.replace(/^\d+\.\s+/, "");
      if (!currentList || !currentList.ordered) {
        currentList = { items: [], ordered: true };
      }
      currentList.items.push(itemText);
      continue;
    }

    // Handle empty lines
    if (trimmed === "") {
      flushParagraph();
      flushList();
      continue;
    }

    // Regular paragraph text
    flushList();
    currentParagraph.push(line);
  }

  // Flush any remaining content
  flushParagraph();
  flushList();
  flushTable();

  return blocks;
}

function createStyles(theme: PdfThemeConfig) {
  return StyleSheet.create({
    page: {
      paddingTop: 60,
      paddingBottom: 80,
      paddingHorizontal: 50,
      fontSize: 10,
      fontFamily: "Helvetica",
      backgroundColor: theme.pageBg,
      color: theme.pageText,
      lineHeight: 1.6,
    },
    header: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 2,
      borderBottomColor: theme.accent,
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    logoContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    logoIcon: {
      width: 160,
      height: 54,
      objectFit: "contain",
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.titleText,
      lineHeight: 1.3,
      flex: 1,
      textAlign: "right",
      marginLeft: 20,
    },
    meta: {
      fontSize: 9,
      color: theme.footerText,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: theme.sectionTitleText,
      marginBottom: 10,
      marginTop: 18,
      paddingTop: 6,
      paddingBottom: 2,
      borderBottomWidth: 1,
      borderBottomColor: theme.sectionTitleBorder,
    },
    subsectionTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: theme.subsectionText,
      marginBottom: 8,
      marginTop: 12,
    },
    sectionContent: {
      fontSize: 10,
      color: theme.paragraphText,
      lineHeight: 1.7,
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 10,
      color: theme.paragraphText,
      lineHeight: 1.7,
      marginBottom: 10,
      textAlign: "justify",
    },
    listItem: {
      fontSize: 10,
      color: theme.listText,
      lineHeight: 1.6,
      marginBottom: 6,
      paddingLeft: 12,
    },
    bulletPoint: {
      fontSize: 10,
      color: theme.accent,
      marginRight: 6,
    },
    grid: {
      display: "flex",
      flexDirection: "row",
      marginBottom: 15,
      gap: 10,
    },
    gridItem: {
      flex: 1,
      padding: 10,
      backgroundColor: theme.gridItemBg,
      borderWidth: 1,
      borderColor: theme.gridItemBorder,
    },
    gridLabel: {
      fontSize: 9,
      fontWeight: "bold",
      color: theme.gridLabelText,
      marginBottom: 3,
      textTransform: "uppercase",
    },
    gridValue: {
      fontSize: 10,
      color: theme.gridValueText,
    },
    table: {
      marginBottom: 18,
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.tableBorder,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: theme.tableCellBorder,
      minHeight: 32,
    },
    tableHeaderRow: {
      flexDirection: "row",
      backgroundColor: theme.tableHeaderBg,
      borderBottomWidth: 2,
      borderBottomColor: theme.tableHeaderBorder,
      minHeight: 36,
    },
    tableCell: {
      flex: 1,
      padding: 10,
      fontSize: 9,
      color: theme.tableCellText,
      textAlign: "left",
      justifyContent: "center",
      minHeight: 28,
    },
    tableHeader: {
      flex: 1,
      padding: 10,
      fontSize: 10,
      fontWeight: "bold",
      color: theme.tableHeaderText,
      textAlign: "left",
      justifyContent: "center",
    },
    bold: {
      fontWeight: "bold",
      color: theme.titleText,
    },
    emphasis: {
      fontStyle: "italic",
      color: theme.subsectionText,
    },
    divider: {
      marginVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.sectionTitleBorder,
    },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 50,
      right: 50,
      paddingTop: 10,
      paddingBottom: 5,
      borderTopWidth: 1,
      borderTopColor: theme.footerBorder,
      alignItems: "center",
      backgroundColor: theme.footerBg,
    },
    footerText: {
      fontSize: 8,
      color: theme.footerText,
      textAlign: "center",
      marginBottom: 3,
      fontStyle: "italic",
    },
    footerLogo: {
      fontSize: 9,
      color: theme.footerLogo,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 3,
    },
    footerCopyright: {
      fontSize: 7,
      color: theme.footerCopyright,
      textAlign: "center",
    },
  });
}

export async function generateBriefPdf(brief: Brief, themeId: string = "classic"): Promise<Blob> {
  const themeConfig = PDF_THEMES[themeId] ?? PDF_THEMES.classic;
  const styles = createStyles(themeConfig);

  // Parse the content markdown into sections
  const sections = brief.content.split(/\n(?=#+\s)/);

  const doc = (
    <Document>
      <Page style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Image
                src="/logo.png"
                style={styles.logoIcon}
              />
            </View>
            <Text style={styles.title}>{brief.title}</Text>
          </View>
          <Text style={styles.meta}>
            Generated by ORIGO • {new Date(brief.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Project Type and Key Info */}
        {brief.projectType && (
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Project Type</Text>
              <Text style={styles.gridValue}>{brief.projectType}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Status</Text>
              <Text style={styles.gridValue}>Active</Text>
            </View>
          </View>
        )}

        {/* Brief Content Sections */}
        {sections.map((section, index) => {
          const titleMatch = section.match(/#+\s(.+)/);
          const title = titleMatch ? titleMatch[1] : `Section ${index + 1}`;
          const content = titleMatch
            ? section.replace(/#+\s.+\n/, "").trim()
            : section.trim();

          const contentBlocks = content ? parseContentBlocks(content) : [];

          return (
            <View key={index} style={styles.section} wrap={false}>
              {title && <Text style={styles.sectionTitle}>{title}</Text>}
              {contentBlocks.map((block, blockIndex) => {
                if (block.type === "heading") {
                  return (
                    <Text key={blockIndex} style={styles.subsectionTitle}>
                      {block.content as string}
                    </Text>
                  );
                } else if (block.type === "paragraph") {
                  const inlineParts = parseInlineMarkdown(block.content as string);
                  return (
                    <Text key={blockIndex} style={styles.paragraph}>
                      {inlineParts.map((part, partIndex) => (
                        <Text key={partIndex} style={part.bold ? styles.bold : {}}>
                          {part.text}
                        </Text>
                      ))}
                    </Text>
                  );
                } else if (block.type === "list") {
                  const listData = block.content as ListData;
                  return (
                    <View key={blockIndex} style={{ marginBottom: 12 }}>
                      {listData.items.map((item, itemIndex) => {
                        const inlineParts = parseInlineMarkdown(item);
                        return (
                          <View key={itemIndex} style={{ flexDirection: "row", marginBottom: 6 }}>
                            <Text style={styles.bulletPoint}>
                              {listData.ordered ? `${itemIndex + 1}.` : "•"}
                            </Text>
                            <Text style={styles.listItem}>
                              {inlineParts.map((part, partIndex) => (
                                <Text key={partIndex} style={part.bold ? styles.bold : {}}>
                                  {part.text}
                                </Text>
                              ))}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                } else if (block.type === "table") {
                  const tableData = block.content as TableData;
                  return (
                    <View key={blockIndex} style={styles.table} wrap={false}>
                      {/* Table Header Row */}
                      <View style={styles.tableHeaderRow}>
                        {tableData.headers.map((header, headerIndex) => (
                          <Text key={headerIndex} style={styles.tableHeader}>
                            {header}
                          </Text>
                        ))}
                      </View>
                      {/* Table Data Rows */}
                      {tableData.rows.map((row, rowIndex) => (
                        <View
                          key={rowIndex}
                          style={
                            rowIndex === tableData.rows.length - 1
                              ? [styles.tableRow, { borderBottomWidth: 0 }]
                              : styles.tableRow
                          }
                        >
                          {row.map((cell, cellIndex) => {
                            const cellParts = parseInlineMarkdown(cell || " ");
                            return (
                              <Text key={cellIndex} style={styles.tableCell}>
                                {cellParts.map((part, partIndex) => (
                                  <Text key={partIndex} style={part.bold ? styles.bold : {}}>
                                    {part.text || " "}
                                  </Text>
                                ))}
                              </Text>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  );
                }
                return null;
              })}
            </View>
          );
        })}

        {/* Footer - minimalist design */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by ORIGO • {new Date(brief.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
      </Page>
    </Document>
  );

  // Generate PDF blob using pdf() from @react-pdf/renderer
  return pdf(doc).toBlob();
}
