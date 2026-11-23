"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Loaded on demand so the markdown libraries stay out of other pages. */
export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer" /> }}
    >
      {children}
    </ReactMarkdown>
  );
}
