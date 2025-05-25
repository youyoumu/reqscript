import type { ReqscriptMetadata } from "#reqscript";
import type { MiddlewareCallbackParams, Middleware } from "openapi-fetch";

async function serializeFullRequest(req: Request): Promise<ReqscriptMetadata> {
  const cloned = req.clone();
  const bodyText = await cloned.text();
  return {
    __reqscriptMetadata: true,
    method: cloned.method,
    url: cloned.url,
    headers: Object.fromEntries(cloned.headers.entries()),
    body: bodyText,
  };
}

export const openApiFetch: Middleware = {
  async onRequest(options: MiddlewareCallbackParams) {
    const json = JSON.stringify(await serializeFullRequest(options.request));
    return new Response(json);
  },
};
