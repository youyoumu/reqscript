export default async function (w: WretchBuilder) {
  return await w("https://animechan.io/api/v1/quotes/random").get().json();
}
