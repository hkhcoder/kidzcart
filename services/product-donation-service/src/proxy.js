const httpProxy = require("http-proxy");

/**
 * Forward to another origin while fixing Express mount stripping (req.url must use originalUrl path).
 */
function createMountedProxy(targetOrigin) {
  const proxy = httpProxy.createServer({
    target: targetOrigin,
    changeOrigin: true,
    xfwd: true,
  });

  proxy.on("error", (err, req, res) => {
    if (res.headersSent) return;
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Upstream unavailable", detail: err.message }));
  });

  return (req, res) => {
    try {
      const u = new URL(req.originalUrl || req.url, "http://127.0.0.1");
      req.url = u.pathname + u.search;
      proxy.web(req, res);
    } catch (e) {
      res.status(500).json({ message: "Proxy error", detail: String(e) });
    }
  };
}

module.exports = { createMountedProxy };
