export const REPO = { owner: "NOTAM-bobk", name: "Docs", branch: "main", folder: "files" };

export type DocFile = { path: string; name: string; folder: string; size: number; ext: string };

export async function fetchDocs(): Promise<DocFile[]> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO.owner}/${REPO.name}/git/trees/${REPO.branch}?recursive=1`,
    { headers: { Accept: "application/vnd.github+json" } },
  );
  if (!res.ok) throw new Error(`GitHub responded ${res.status}`);
  const data = (await res.json()) as { tree: { path: string; type: string; size?: number }[] };
  return data.tree
    .filter((t) => t.type === "blob" && t.path.startsWith(REPO.folder + "/") && !t.path.split("/").pop()!.startsWith("."))
    .map((t) => {
      const parts = t.path.split("/").slice(1);
      const name = parts.pop()!;
      const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
      return { path: t.path, name, folder: parts.join("/"), size: t.size ?? 0, ext };
    });
}

const enc = (p: string) => p.split("/").map(encodeURIComponent).join("/");
export const cdnUrl = (p: string) => `https://cdn.jsdelivr.net/gh/${REPO.owner}/${REPO.name}@${REPO.branch}/${enc(p)}`;
export const rawUrl = (p: string) => `https://raw.githubusercontent.com/${REPO.owner}/${REPO.name}/${REPO.branch}/${enc(p)}`;

export function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

export const IMAGE = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"];
export const TEXT = ["md", "txt", "json", "csv", "js", "ts", "tsx", "html", "css", "yml", "yaml", "xml", "py", "sh", "log"];
export const OFFICE = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];
export function kind(ext: string) {
  if (ext === "pdf") return "pdf";
  if (IMAGE.includes(ext)) return "image";
  if (TEXT.includes(ext)) return "text";
  if (OFFICE.includes(ext)) return "office";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  return "other";
}
