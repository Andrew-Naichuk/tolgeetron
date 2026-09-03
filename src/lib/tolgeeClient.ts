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
 * See: https://docs.tolgee.io/api/create-or-update-translations */
export async function createOrUpdateKey(
  config: TolgeeClientConfig,
  params: { keyName: string; namespace?: string; baseLanguage: string; text: string }
): Promise<{ keyId: number }> {
  const result = await request<{ keyId: number }>(
    config,
    "/keys/create-or-update-translations",
    {
      method: "POST",
      body: JSON.stringify({
        key: { name: params.keyName, namespace: params.namespace },
        translations: { [params.baseLanguage]: params.text },
      }),
    }
  );
  return result;
}

/** Search existing keys by name/translation text.
 * See: https://docs.tolgee.io/api/search-for-key */
export async function searchKeys(
  config: TolgeeClientConfig,
  search: string
): Promise<TolgeeKeySearchResult[]> {
  if (!search.trim()) return [];
  const query = new URLSearchParams({ search, size: "20" });
  const result = await request<{
    _embedded?: { keys?: Array<{ keyId: number; keyName: string; keyNamespace?: string }> };
  }>(config, `/keys/search?${query.toString()}`);
  return (result._embedded?.keys ?? []).map((k) => ({
    keyId: k.keyId,
    keyName: k.keyName,
    namespace: k.keyNamespace,
  }));
}

/** Build a deep link to a key's edit view in the Tolgee web app. */
export function buildKeyUrl(config: TolgeeClientConfig, keyId: number): string {
  return `${config.apiUrl.replace(/\/+$/, "")}/projects/${config.projectId}/translations?key=${keyId}`;
}
