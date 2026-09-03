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

/** Search existing keys by name/translation text.
 * GET /v2/projects/{projectId}/keys/search, per KeyController.kt. Each
 * result's fields are id/name/namespace/baseTranslation, per
 * KeySearchResultView.kt (embedded under "keys", per the @Relation on
 * KeySearchSearchResultModel.kt). */
export async function searchKeys(
  config: TolgeeClientConfig,
  search: string
): Promise<TolgeeKeySearchResult[]> {
  if (!search.trim()) return [];
  const query = new URLSearchParams({ search, size: "20" });
  const result = await request<{
    _embedded?: {
      keys?: Array<{ id: number; name: string; namespace?: string; baseTranslation?: string }>;
    };
  }>(config, `/keys/search?${query.toString()}`);
  return (result._embedded?.keys ?? []).map((k) => ({
    keyId: k.id,
    keyName: k.name,
    namespace: k.namespace,
    baseTranslation: k.baseTranslation,
  }));
}

/** Build a deep link to a key's edit view in the Tolgee web app. */
export function buildKeyUrl(config: TolgeeClientConfig, keyId: number): string {
  return `${config.apiUrl.replace(/\/+$/, "")}/projects/${config.projectId}/translations?key=${keyId}`;
}
