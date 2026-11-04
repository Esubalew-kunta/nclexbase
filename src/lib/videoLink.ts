/*
 * Which video addresses may be attached to a question's explanation.
 *
 * This is the browser's copy of App\Support\VideoLink in the API, kept so the editor can say "that
 * link is not allowed" before anything is sent, and so a student's page never puts a stored address
 * into an iframe without checking it again. The server is the authority: it runs the same rules on
 * every save and works out the player address itself, whatever this file sent.
 *
 * scripts/check-video-link.mjs runs the same list of addresses through both (the fixture is a copy
 * of the API's tests/Fixtures/video-links.json), so the two cannot drift apart unnoticed.
 *
 * Plain TypeScript with no imports on purpose: the check script loads this file directly.
 */

export type VideoProvider = "youtube" | "vimeo" | "file";

export interface ParsedVideoLink {
  provider: VideoProvider;
  /** The address as the admin pasted it (trimmed). */
  url: string;
  /** What a player is pointed at: an iframe address, or for a direct file the file itself. */
  embedUrl: string;
}

export const VIDEO_LINK_MESSAGE = "Use a YouTube or Vimeo address, or a direct https link to an .mp4 or .webm file.";

const MAX_LENGTH = 500;
const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"];
const VIMEO_HOSTS = ["vimeo.com", "www.vimeo.com", "player.vimeo.com"];
const FILE_EXTENSIONS = ["mp4", "webm", "ogg", "ogv"];

export function parseVideoLink(input: unknown): ParsedVideoLink | null {
  if (typeof input !== "string") return null;
  const url = input.trim();

  // No control characters, spaces or backslashes: they are how an "https://" check gets smuggled past.
  if (url === "" || url.length > MAX_LENGTH || /[\x00-\x20\x7f\\]/.test(url)) return null;
  if (!url.toLowerCase().startsWith("https://")) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
  // The default port is dropped by URL, so anything left is a different one.
  if (parsed.port !== "") return null;

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;
  const last = (name: string) => {
    const all = parsed.searchParams.getAll(name);
    return all.length ? all[all.length - 1] : null;
  };

  if (YOUTUBE_HOSTS.includes(host)) {
    const id = youtubeId(host, path, last("v"));
    return id === null ? null : { provider: "youtube", url, embedUrl: `https://www.youtube-nocookie.com/embed/${id}` };
  }

  if (VIMEO_HOSTS.includes(host)) {
    const found = vimeo(host, path, last("h"));
    return found === null
      ? null
      : { provider: "vimeo", url, embedUrl: `https://player.vimeo.com/video/${found.id}?dnt=1${found.hash !== null ? `&h=${found.hash}` : ""}` };
  }

  if (isPlainDomain(host) && !path.endsWith("/") && FILE_EXTENSIONS.includes(extensionOf(path))) {
    return { provider: "file", url, embedUrl: url };
  }

  return null;
}

function youtubeId(host: string, path: string, v: string | null): string | null {
  let candidate: string | null = null;
  if (host === "youtu.be") candidate = path.replace(/^\/+/, "");
  else if (path === "/watch") candidate = v;
  else {
    const m = /^\/(embed|shorts|live|v)\/([^/]+)\/?$/.exec(path);
    if (m) candidate = m[2];
  }
  return candidate !== null && /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
}

function vimeo(host: string, path: string, h: string | null): { id: string; hash: string | null } | null {
  let id: string;
  let hash: string | null;
  if (host === "player.vimeo.com") {
    const m = /^\/video\/(\d{4,12})\/?$/.exec(path);
    if (!m) return null;
    id = m[1];
    hash = h;
  } else {
    const m = /^\/(\d{4,12})(?:\/([A-Za-z0-9]{6,32}))?\/?$/.exec(path);
    if (!m) return null;
    id = m[1];
    hash = m[2] ?? h;
  }
  if (hash !== null && !/^[A-Za-z0-9]{6,32}$/.test(hash)) return null;
  return { id, hash };
}

/** The part after the last dot of the last path segment, lower-cased; "" when there is none. */
function extensionOf(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

/** A real name: letters, digits and hyphens in at least two labels. Not an address, not "localhost". */
function isPlainDomain(host: string): boolean {
  return host.length >= 4 && host.length <= 253 && /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) && !/^\d+(\.\d+)*$/.test(host);
}
