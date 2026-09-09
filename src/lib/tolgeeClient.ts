import type { TolgeeKeySearchResult } from "./types";

export interface TolgeeClientConfig {
  apiUrl: string;
  projectId: string;
  apiKey: string;
}

export class TolgeeApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "TolgeeApiError";
  }
}

function baseUrl(config: TolgeeClientConfig): string {
  return `${config.apiUrl.replace(/\/+$/, "")}/v2/projects/${config.projectId}`;
}

async function request<T>(
  config: TolgeeClientConfig,
  path: string,
  init?: RequestInit
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl(config)}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
        ...init?.headers,
      },
    });
  } catch (cause) {
    throw new TolgeeApiError(
      `Could not reach Tolgee at ${config.apiUrl}. Check the API URL and that it's allowed in manifest.json's networkAccess.`
    );
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new TolgeeApiError(
      `Tolgee API request failed (${response.status}): ${body || response.statusText}`,
      response.status
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Create a new key (or update translations of an existing key with the
 * same name) and set its base-language translation.
 * POST /v2/projects/{projectId}/translations -> SetTranslationsWithKeyDto,
 * per TranslationsController.kt / SetTranslationsWithKeyDto.kt in
 * tolgee-platform. The response (SetTranslationsResponseModel) carries
 * keyId/keyName/keyNamespace at the top level. */
export async function createOrUpdateKey(
  config: TolgeeClientConfig,
  params: { keyName: string; namespace?: string; baseLanguage: string; text: string }
): Promise<{ keyId: number }> {
  const result = await request<{ keyId: number }>(config, "/translations", {
    method: "POST",
    body: JSON.stringify({
      key: params.keyName,
      namespace: params.namespace,
      translations: { [params.baseLanguage]: params.text },
    }),
  });
  return result;
}

type KeySearchPage = {
  _embedded?: {
    keys?: Array<{ id: number; name: string; namespace?: string; baseTranslation?: string }>;
  };
  page?: { totalPages?: number };
};

function mapKeySearchResults(
  keys: NonNullable<NonNullable<KeySearchPage["_embedded"]>["keys"]>
): TolgeeKeySearchResult[] {
  return keys.map((k) => ({
    keyId: k.id,
    keyName: k.name,
    namespace: k.namespace,
    baseTranslation: k.baseTranslation,
  }));
}

/** Search existing keys by name/translation text.
 * Without tag filters: GET /v2/projects/{projectId}/keys/search, per
 * KeyController.kt (KeySearchResultView.kt fields under "keys").
 * With tag filters: GET /translations with search + filterTag (same filters
 * as the translation view), since /keys/search does not support tags.
 * Pages until all matches are collected. */
export async function searchKeys(
  config: TolgeeClientConfig,
  search: string,
  options?: { filterTags?: string[]; baseLanguage?: string }
): Promise<TolgeeKeySearchResult[]> {
  if (!search.trim()) return [];

  const filterTags = (options?.filterTags ?? []).map((t) => t.trim()).filter(Boolean);
  if (filterTags.length > 0) {
    return searchKeysWithTags(
      config,
      search.trim(),
      filterTags,
      options?.baseLanguage?.trim() || "en"
    );
  }

  const pageSize = 100;
  const all: TolgeeKeySearchResult[] = [];
  let pageIndex = 0;
  let totalPages = 1;

  while (pageIndex < totalPages) {
    const query = new URLSearchParams({
      search,
      size: String(pageSize),
      page: String(pageIndex),
    });
    const result = await request<KeySearchPage>(
      config,
      `/keys/search?${query.toString()}`
    );
    const keys = result._embedded?.keys ?? [];
    all.push(...mapKeySearchResults(keys));
    totalPages = result.page?.totalPages ?? 1;
    pageIndex += 1;
    if (keys.length === 0) break;
  }

  return all;
}

type TranslationsSearchPage = {
  _embedded?: {
    keys?: Array<{
      keyId: number;
      keyName: string;
      keyNamespace?: string;
      translations?: Record<string, { text?: string } | undefined>;
    }>;
  };
  page?: { totalPages?: number };
};

async function searchKeysWithTags(
  config: TolgeeClientConfig,
  search: string,
  filterTags: string[],
  baseLanguage: string
): Promise<TolgeeKeySearchResult[]> {
  const pageSize = 100;
  const all: TolgeeKeySearchResult[] = [];
  let pageIndex = 0;
  let totalPages = 1;

  while (pageIndex < totalPages) {
    const query = new URLSearchParams({
      search,
      size: String(pageSize),
      page: String(pageIndex),
      languages: baseLanguage,
    });
    for (const tag of filterTags) {
      query.append("filterTag", tag);
    }
    const result = await request<TranslationsSearchPage>(
      config,
      `/translations?${query.toString()}`
    );
    const keys = result._embedded?.keys ?? [];
    all.push(
      ...keys.map((k) => ({
        keyId: k.keyId,
        keyName: k.keyName,
        namespace: k.keyNamespace,
        baseTranslation: k.translations?.[baseLanguage]?.text,
      }))
    );
    totalPages = result.page?.totalPages ?? 1;
    pageIndex += 1;
    if (keys.length === 0) break;
  }

  return all;
}

/** List tag names used in the project.
 * GET /v2/projects/{projectId}/tags, per TagsController. */
export async function listTags(config: TolgeeClientConfig): Promise<string[]> {
  const pageSize = 1000;
  const names: string[] = [];
  let pageIndex = 0;
  let totalPages = 1;

  while (pageIndex < totalPages) {
    const query = new URLSearchParams({
      size: String(pageSize),
      page: String(pageIndex),
      sort: "name,asc",
    });
    const result = await request<{
      _embedded?: { tags?: Array<{ id: number; name: string }> };
      page?: { totalPages?: number };
    }>(config, `/tags?${query.toString()}`);
    for (const tag of result._embedded?.tags ?? []) {
      if (tag.name) names.push(tag.name);
    }
    totalPages = result.page?.totalPages ?? 1;
    pageIndex += 1;
    if ((result._embedded?.tags ?? []).length === 0) break;
  }

  return names;
}

export interface TolgeeLanguage {
  id: number;
  name: string;
  tag: string;
  base: boolean;
}

/** List languages configured for the project.
 * GET /v2/projects/{projectId}/languages, per LanguagesController. */
export async function listLanguages(config: TolgeeClientConfig): Promise<TolgeeLanguage[]> {
  const result = await request<{
    _embedded?: {
      languages?: Array<{
        id: number;
        name: string;
        tag: string;
        base?: boolean;
      }>;
    };
  }>(config, "/languages?size=1000");
  return (result._embedded?.languages ?? []).map((lang) => ({
    id: lang.id,
    name: lang.name,
    tag: lang.tag,
    base: Boolean(lang.base),
  }));
}

/** Fetch translations for specific keys in one language.
 * GET /v2/projects/{projectId}/translations with languages + filterKeyId. */
export async function getTranslationsForKeys(
  config: TolgeeClientConfig,
  params: { language: string; keyIds: number[] }
): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  const uniqueIds = [...new Set(params.keyIds)].filter((id) => Number.isFinite(id));
  if (!params.language || uniqueIds.length === 0) return out;

  const query = new URLSearchParams({
    languages: params.language,
    size: String(Math.max(uniqueIds.length, 1)),
  });
  for (const id of uniqueIds) {
    query.append("filterKeyId", String(id));
  }

  const result = await request<{
    _embedded?: {
      keys?: Array<{
        keyId: number;
        translations?: Record<string, { text?: string } | undefined>;
      }>;
    };
  }>(config, `/translations?${query.toString()}`);

  for (const key of result._embedded?.keys ?? []) {
    const text = key.translations?.[params.language]?.text ?? "";
    out.set(key.keyId, text);
  }
  return out;
}

/** Build a deep link to a key's edit view in the Tolgee web app. */
export function buildKeyUrl(config: TolgeeClientConfig, keyName: string): string {
  return `${config.apiUrl.replace(/\/+$/, "")}/projects/${config.projectId}/translations?search=${encodeURIComponent(keyName)}`;
}
