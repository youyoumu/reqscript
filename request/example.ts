export default function (w: Wretch) {
  return w.get("https://nekos.best/api/v2/neko2").json();
}
