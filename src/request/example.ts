import { createRequest } from "#reqscript";

export const Request = createRequest((w) =>
  w.get("https://nekos.best/api/v2/neko"),
);
