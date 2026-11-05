"use client";

import { create } from "zustand";
import { api, ApiError, apiMode } from "@/lib/api/client";
import type { CollectionName, Collections, QuestionRec } from "@/lib/admin/types";
import type { SiteConfig } from "@/lib/admin/config";
import type { ExplanationVideo } from "@/lib/types";

/*
 * The content the API sent, held in one place so lib/content can stay synchronous.
 *
 * About a hundred components read content through `getAll`/`useAll`/`getBank`, and those are
 * plain function calls, not suspendable reads. Rather than make every caller async, the app
 * loads its content once at boot and these functions read from this store afterwards. In
 * local mode (NEXT_PUBLIC_API_URL unset) the store stays empty and lib/content reads the
 * bundled seed exactly as before.
 */

/** A readiness case as the API sends it: the wrapper, with its items referenced by id. */
export interface ApiReadinessCase {
  id: string;
  title: string;
  subject: string;
  intro: string;
  exhibit: boolean;
  tabs: { label: string; content: unknown }[];
  itemIds: string[];
}

interface BootstrapResponse {
  collections: Partial<{ [K in CollectionName]: Collections[K][] }>;
  readinessCases: ApiReadinessCase[];
  config: SiteConfig;
  copy: { key: string; page: string; label: string; value: string; long: boolean }[];
}

interface ApiContentState {
  /** `off` in local mode, so callers can tell "not loaded yet" from "never will be". */
  status: "off" | "loading" | "ready" | "error";
  error?: string;
  collections: Partial<{ [K in CollectionName]: Collections[K][] }>;
  readinessCases: ApiReadinessCase[];
  config?: SiteConfig;
  /** key → default text, replacing COPY_DEFAULTS when the API is in charge. */
  copy: Record<string, string>;
  questions?: QuestionRec[];
  /**
   * Where the question bank stands. `signedOut` is the server saying the session is gone (a 401),
   * `error` is any other failure after the retries; both leave `questions` undefined, and the
   * screens must say so rather than show an empty list.
   */
  bank: "idle" | "loading" | "ready" | "error" | "signedOut";
  /**
   * Each case study's own video, by case id. It arrives with the question bank, not the catalogue:
   * the catalogue is public and the video explains the answers.
   */
  caseVideos: Record<string, ExplanationVideo>;
}

export const useApiContent = create<ApiContentState>(() => ({
  status: apiMode() ? "loading" : "off",
  collections: {},
  readinessCases: [],
  copy: {},
  caseVideos: {},
  bank: "idle",
}));

/** True once content may be read: either the API answered, or there is no API to wait for. */
export const contentReady = () => {
  const s = useApiContent.getState();
  return s.status === "off" || s.status === "ready";
};

let inFlight: Promise<void> | null = null;

/**
 * Loads the catalogue, and the question bank too when the viewer is signed in.
 *
 * The bank is behind auth, so a 401 is the expected answer for a guest and must not fail the
 * boot — marketing and catalogue pages render fine without questions.
 */
export function loadApiContent(opts: { withBank?: boolean } = {}): Promise<void> {
  if (!apiMode()) return Promise.resolve();
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const boot = await api<BootstrapResponse>("/content/bootstrap");

      useApiContent.setState({
        status: "ready",
        error: undefined,
        collections: boot.collections,
        readinessCases: boot.readinessCases,
        config: boot.config,
        copy: Object.fromEntries(boot.copy.map((c) => [c.key, c.value])),
      });
    } catch (err) {
      useApiContent.setState({ status: "error", error: err instanceof Error ? err.message : "Content could not be loaded." });
      inFlight = null;
      return;
    }

    if (opts.withBank !== false) await loadQuestionBank();
    inFlight = null;
  })();

  return inFlight;
}

/** Waits before each retry of the bank: a cold server or a busy minute (429) usually clears in seconds. */
const BANK_RETRY_MS = [1000, 3000, 8000];

let bankInFlight: Promise<void> | null = null;

/**
 * The paid content, fetched separately because it needs a session.
 *
 * One call at a time: the shell, the login and the admin sync all ask for it. A 401 means the
 * session is gone, which is not worth retrying; a 429, a 5xx or a dropped connection is. Nothing
 * here is silent: the outcome is in `bank`, and the screens read it.
 */
export function loadQuestionBank(): Promise<void> {
  if (!apiMode() || useApiContent.getState().questions) return Promise.resolve();
  if (bankInFlight) return bankInFlight;

  bankInFlight = (async () => {
    useApiContent.setState({ bank: "loading" });
    for (let attempt = 0; ; attempt++) {
      try {
        const { questions, caseVideos } = await api<{ questions: QuestionRec[]; caseVideos?: Record<string, ExplanationVideo> }>("/content/bank");
        useApiContent.setState({ questions, caseVideos: caseVideos ?? {}, bank: "ready" });
        return;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          useApiContent.setState({ bank: "signedOut" });
          return;
        }
        if (attempt >= BANK_RETRY_MS.length) {
          useApiContent.setState({ bank: "error" });
          return;
        }
        await new Promise((r) => setTimeout(r, BANK_RETRY_MS[attempt]));
      }
    }
  })().finally(() => {
    bankInFlight = null;
  });

  return bankInFlight;
}

/** Test hook: forget everything so a reload re-fetches. */
export function resetApiContent(): void {
  inFlight = null;
  bankInFlight = null;
  useApiContent.setState({
    status: apiMode() ? "loading" : "off",
    bank: "idle",
    error: undefined,
    collections: {},
    readinessCases: [],
    config: undefined,
    copy: {},
    questions: undefined,
    caseVideos: {},
  });
}
