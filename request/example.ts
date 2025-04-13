export default async function (w: Wretch) {
  return await w.get("https://nekos.best/api/v2/neko2").json();
}
