import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { cdnUrl, fetchDocs, formatSize, kind, rawUrl, REPO, type DocFile } from "@/lib/docs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Docs — Document Hub" },
      { name: "description", content: "Browse, preview and download documents." },
      { property: "og:title", content: "Docs — Document Hub" },
      { property: "og:description", content: "Browse, preview and download documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const q = useQuery({ queryKey: ["docs"], queryFn: fetchDocs, enabled: mounted, staleTime: 60_000 });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<DocFile | null>(null);

  const files = useMemo(
    () => (q.data ?? []).filter((f) => f.path.toLowerCase().includes(search.toLowerCase())),
    [q.data, search],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-foreground"><path d="M12 2 22 20H2z" /></svg>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">Docs</span>
          <a
            href={`https://github.com/${REPO.owner}/${REPO.name}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-sm text-muted-foreground hover:text-foreground"
          >
            GitHub ↗
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-4xl font-semibold tracking-tighter sm:text-5xl">Documents</h1>
        <p className="mt-3 text-muted-foreground">Preview and download every file in one place.</p>

        <div className="mt-8 flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="input-3d h-11 w-full bg-background px-3 text-sm outline-none"
          />
          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
            {q.data ? `${files.length} files` : ""}
          </span>
        </div>

        <div className="card-3d mt-6 overflow-hidden">
          {(!mounted || q.isLoading) &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex h-16 items-center gap-3 border-b border-border px-4 last:border-0">
                <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                <div className="h-3 w-48 animate-pulse rounded bg-muted" />
              </div>
            ))}
          {q.isError && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Couldn't load documents. {(q.error as Error).message}
            </div>
          )}
          {q.data && files.length === 0 && (
            <div className="p-12 text-center">
              <p className="font-medium">No documents yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload files to the GitHub repository and they'll appear here.
              </p>
            </div>
          )}
          {files.map((f) => (
            <div
              key={f.path}
              className="group flex items-center gap-3 border-b-2 border-border px-4 py-3 transition-colors last:border-0 hover:bg-muted/50"
            >
              <button onClick={() => setOpen(f)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-b-4 border-border bg-muted font-mono font-semibold text-[10px] uppercase text-muted-foreground">
                  {f.ext || "file"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{f.name}</span>
                  <span className="block truncate font-mono text-xs text-muted-foreground">
                    {f.folder ? `${f.folder} · ` : ""}
                    {formatSize(f.size)}
                  </span>
                </span>
              </button>
              <button
                onClick={() => setOpen(f)}
                className="btn-3d btn-3d-ghost hidden sm:inline-flex"
              >
                Preview
              </button>
              <a
                href={rawUrl(f.path)}
                download={f.name}
                className="btn-3d"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </main>

      {open && <Preview file={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Preview({ file, onClose }: { file: DocFile; onClose: () => void }) {
  const k = kind(file.ext);
  const url = cdnUrl(file.path);
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (k === "text") fetch(rawUrl(file.path)).then((r) => r.text()).then(setText).catch(() => setText("Failed to load."));
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [file.path, k, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-2 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-5xl flex-col overflow-hidden card-3d"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.path}</span>
          <a href={rawUrl(file.path)} download={file.name} className="btn-3d">
            Download
          </a>
          <button onClick={onClose} className="btn-3d btn-3d-ghost w-9 px-0" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-muted/40">
          {k === "pdf" && <iframe src={url} title={file.name} className="h-full w-full" />}
          {k === "image" && <img src={url} alt={file.name} className="mx-auto max-h-full object-contain p-4" />}
          {k === "video" && <video src={url} controls className="mx-auto max-h-full" />}
          {k === "office" && (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(rawUrl(file.path))}`}
              title={file.name}
              className="h-full w-full"
            />
          )}
          {k === "text" && (
            <pre className="whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed">{text ?? "Loading..."}</pre>
          )}
          {k === "other" && (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
              No preview available for this file type. Use Download instead.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
