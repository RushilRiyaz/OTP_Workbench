import React from "react";

function highlightLine(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    const keyMatch = remaining.match(/^(\s*)"([^"]*)"(\s*:)/);
    if (keyMatch) {
      parts.push(<span key={key++}>{keyMatch[1]}</span>);
      parts.push(<span key={key++} className="text-purple-600 dark:text-purple-400">&quot;{keyMatch[2]}&quot;</span>);
      parts.push(<span key={key++}>{keyMatch[3]}</span>);
      remaining = remaining.slice(keyMatch[0].length);
      continue;
    }

    const strMatch = remaining.match(/^"([^"]*)"/);
    if (strMatch) {
      parts.push(<span key={key++} className="text-green-600 dark:text-green-400">&quot;{strMatch[1]}&quot;</span>);
      remaining = remaining.slice(strMatch[0].length);
      continue;
    }

    const numMatch = remaining.match(/^(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/);
    if (numMatch) {
      parts.push(<span key={key++} className="text-blue-600 dark:text-blue-400">{numMatch[1]}</span>);
      remaining = remaining.slice(numMatch[0].length);
      continue;
    }

    const boolMatch = remaining.match(/^(true|false|null)/);
    if (boolMatch) {
      parts.push(<span key={key++} className="text-orange-600 dark:text-orange-400">{boolMatch[1]}</span>);
      remaining = remaining.slice(boolMatch[0].length);
      continue;
    }

    parts.push(<span key={key++}>{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return <>{parts}</>;
}

export default function JsonHighlighted({ json }: { json: string }) {
  const lines = json.split("\n");

  return (
    <>
      {lines.map((line, i) => (
        <div key={i}>{highlightLine(line)}</div>
      ))}
    </>
  );
}
