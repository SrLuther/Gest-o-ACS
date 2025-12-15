const http = require("http");
const url = process.env.APP_URL || "";
function ping() {
  if (!url) return;
  try {
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: (u.pathname.endsWith("/") ? u.pathname : u.pathname + "/") + "health", protocol: u.protocol, port: u.port || (u.protocol === "https:" ? 443 : 80), method: "GET" };
    const req = (opts.protocol === "https:" ? require("https") : http).request(opts, (res) => {
      // consume
      res.on("data", () => {});
    });
    req.on("error", () => {});
    req.end();
  } catch {}
}
ping();
