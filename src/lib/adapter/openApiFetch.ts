import type { ReqscriptMetadata } from "#reqscript";

export async function openApiFetch(
  clientResponse: Promise<{ data?: any }>,
): Promise<ReqscriptMetadata> {
  const reqscriptMetadata = (await clientResponse)
    ?.data as unknown as ReqscriptMetadata;
  if (!reqscriptMetadata?.__reqscriptMetadata) {
    throw Error(
      "reqscriptMetadata is not valid, have you used openApiFetch middleware?",
    );
  }
  return reqscriptMetadata;
}
