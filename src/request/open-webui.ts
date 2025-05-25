import { createRequest } from "#reqscript";
import createClient from "openapi-fetch";
import { openApiFetchMiddleware } from "../lib/middleware/index.ts";
import { openApiFetchAdapter } from "../lib/adapter/index.ts";

import type { paths } from "../types/open-webui.js";

const client = createClient<paths>({
  baseUrl: "http://localhost:8800",
  headers: {
    Authorization: "Bearer " + "<token>",
  },
});

client.use(openApiFetchMiddleware);

createRequest((w) => {
  return openApiFetchAdapter(
    client.POST("/api/chat/completions", {
      body: {
        // model: "gemma3:4b",
        // messages: [
        //   {
        //     role: "user",
        //     content: `who are you`,
        //   },
        // ],
        // temperature: 2,
      },
    }),
  );
});
