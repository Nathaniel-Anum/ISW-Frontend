import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ignoredDirs = new Set([
  ".git",
  "dist",
  "node_modules",
  "coverage",
  ".vite",
]);

const ignoredFiles = new Set([
  "scripts/bug-bounty-scan.mjs",
]);

const scannedExtensions = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".html",
  ".css",
  ".env",
]);

const rules = [
  {
    id: "unsafe-html-rendering",
    severity: "high",
    message: "Uses dangerouslySetInnerHTML; verify the input is sanitized and trusted.",
    pattern: /dangerouslySetInnerHTML/,
  },
  {
    id: "client-secret-risk",
    severity: "high",
    message: "Possible secret or credential in a committed file. Confirm it is not a real secret.",
    pattern: /\b(api[_-]?key|secret|password|passwd|private[_-]?key|access[_-]?token|refresh[_-]?token)\b\s*[:=]\s*['"]?[A-Za-z0-9_./+=-]{12,}/i,
    redact: true,
    customCheck: (text, index) => {
      const line = getLocation(text, index).snippet;
      return !/\b(localStorage|sessionStorage)\.(getItem|setItem|removeItem)\b/.test(line);
    },
  },
  {
    id: "hard-coded-local-api",
    severity: "medium",
    message: "Hard-coded local API URL can break deployments or point users at the wrong backend.",
    pattern: /https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|172\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?/i,
  },
  {
    id: "insecure-protocol",
    severity: "medium",
    message: "HTTP URL found. Confirm it is not used for production traffic or sensitive data.",
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1)[^\s"'`<>]+/i,
  },
  {
    id: "console-output",
    severity: "low",
    message: "Console output in source can leak workflow data and make debugging noisy in production.",
    pattern: /\bconsole\.(log|debug|info|warn|error)\s*\(/,
  },
  {
    id: "array-index-key",
    severity: "medium",
    message: "Array index used as a React key. Reordering/filtering can attach state or actions to the wrong row.",
    pattern: /key\s*=\s*{\s*(index|idx|i)\s*}/,
  },
  {
    id: "antd-index-row-key",
    severity: "medium",
    message: "Ant Design table appears to use an array index rowKey. Use a stable record id instead.",
    pattern: /rowKey\s*=\s*{\s*\(?\s*[^=,)]*\s*,\s*(index|idx|i)\s*\)?\s*=>\s*(index|idx|i)\s*}/,
  },
  {
    id: "window-location-navigation",
    severity: "low",
    message: "Direct window.location navigation bypasses router state and can hide auth/session bugs.",
    pattern: /window\.location\.(href|assign|replace)\s*[=(]/,
  },
  {
    id: "raw-alert-confirm",
    severity: "low",
    message: "Native alert/confirm blocks React UI flow. Prefer the app modal/notification pattern.",
    pattern: /(^|[^\w.])\b(alert|confirm|prompt)\s*\(/,
  },
  {
    id: "mutation-without-error-feedback",
    severity: "medium",
    message: "Mutation appears to define onSuccess without onError. Check failure feedback and rollback behavior.",
    pattern: /useMutation\s*\(\s*{[\s\S]{0,900}onSuccess\s*:/,
    customCheck: (text, index) => {
      const block = text.slice(index, index + 1200);
      return !/onError\s*:/.test(block);
    },
  },
  {
    id: "todo-marker",
    severity: "info",
    message: "TODO/FIXME marker left in source. Confirm it is not hiding an unfinished bug fix.",
    pattern: /\b(TODO|FIXME|HACK|XXX)\b/i,
  },
];

const findings = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const extension = entry.name === ".env" ? ".env" : path.extname(entry.name);
    if (!scannedExtensions.has(extension)) continue;
    scanFile(fullPath);
  }
}

function scanFile(filePath) {
  const relativePath = path.relative(root, filePath);
  if (ignoredFiles.has(relativePath)) return;

  const text = fs.readFileSync(filePath, "utf8");

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern.source, `${rule.pattern.flags.replace("g", "")}g`);
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (rule.customCheck && !rule.customCheck(text, match.index)) continue;

      const location = getLocation(text, match.index);
      if (isCommentOnlyLine(location.snippet)) continue;

      findings.push({
        rule: rule.id,
        severity: rule.severity,
        file: relativePath,
        line: location.line,
        column: location.column,
        message: rule.message,
        snippet: rule.redact ? redactSnippet(location.snippet) : location.snippet.trim(),
      });
    }
  }
}

function isCommentOnlyLine(snippet) {
  const trimmed = snippet.trim();
  return trimmed.startsWith("//") || trimmed.startsWith("{/*") || trimmed.startsWith("/*") || trimmed.startsWith("*");
}

function getLocation(text, index) {
  const before = text.slice(0, index);
  const line = before.split("\n").length;
  const lineStart = before.lastIndexOf("\n") + 1;
  const lineEnd = text.indexOf("\n", index);
  const snippet = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);

  return {
    line,
    column: index - lineStart + 1,
    snippet,
  };
}

function redactSnippet(snippet) {
  return snippet.replace(/([:=]\s*['"]?)[^'"\s,}]+/g, "$1[redacted]");
}

function severityRank(severity) {
  return {
    high: 0,
    medium: 1,
    low: 2,
    info: 3,
  }[severity] ?? 4;
}

walk(root);

findings.sort((a, b) => {
  const severityDiff = severityRank(a.severity) - severityRank(b.severity);
  if (severityDiff) return severityDiff;
  return `${a.file}:${a.line}`.localeCompare(`${b.file}:${b.line}`);
});

const counts = findings.reduce((acc, finding) => {
  acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
  return acc;
}, {});

console.log("Bug bounty scan complete.");
console.log(`Files scanned from: ${root}`);
console.log(
  `Findings: ${findings.length} ` +
    `(high: ${counts.high ?? 0}, medium: ${counts.medium ?? 0}, low: ${counts.low ?? 0}, info: ${counts.info ?? 0})`,
);

if (!findings.length) {
  console.log("No scanner findings. Run lint/build and continue with manual review.");
  process.exit(0);
}

for (const finding of findings) {
  console.log("");
  console.log(`[${finding.severity.toUpperCase()}] ${finding.rule}`);
  console.log(`${finding.file}:${finding.line}:${finding.column}`);
  console.log(finding.message);
  if (finding.snippet) console.log(`> ${finding.snippet}`);
}

const hasHigh = findings.some((finding) => finding.severity === "high");
process.exit(hasHigh ? 1 : 0);
