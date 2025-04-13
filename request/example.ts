import wretch from "wretch";

export default async function () {
  return await wretch("https://animechan.io/api/v1/quotes/random").get().json();
}
