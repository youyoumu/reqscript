import wretch from "wretch";

export async function animeQuote() {
  return await wretch("https://animechan.io/api/v1/quotes/random")
    .get()
    .json()
    .catch((err) => err);
}
