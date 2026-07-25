import { codeToHtml } from "shiki";

interface CaseCodeBlockProps {
  code: string;
}

// Server Component: runs Shiki at render time, server-side only. The resulting markup is plain HTML with inline styles; no highlighter code ever reaches the client bundle. Rendered as a child passed down into the client-side CaseCodeSection from a Server Component ancestor (see lib/server/case-info.tsx), never imported directly by a "use client" file.
export default async function CaseCodeBlock({ code }: CaseCodeBlockProps) {
  const html = await codeToHtml(code, { lang: "tsx", theme: "dark-plus" });

  return (
    <div
      className="mt-3 overflow-x-auto rounded border border-brand-border text-xs [&_pre]:w-max [&_pre]:min-w-full [&_pre]:p-2"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
