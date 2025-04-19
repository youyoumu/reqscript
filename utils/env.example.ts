import { createEnv } from "@t3-oss/env-core";
import { string } from "valibot";

export const env = createEnv({
  server: {
    PORT: string(),
    HOST: string(),
    DB_HOST: string(),
    DB_PORT: string(),
    DB_USER: string(),
    DB_PASSWORD: string(),
    DB_NAME: string(),
    JWT_SECRET: string(),
    JWT_EXPIRES_IN: string(),
    SENDGRID_API_KEY: string(),
    STRIPE_SECRET_KEY: string(),
    NODE_ENV: string(),
  },

  clientPrefix: "PUBLIC_",

  client: {},

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
