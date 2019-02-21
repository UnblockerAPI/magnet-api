const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const fs = require("fs");
require("events").EventEmitter.prototype._maxListeners = Infinity;

let isProduction = process.env.NODE_ENV === "production";
let PORT = isProduction ? "/tmp/nginx.socket" : 8080;
let callbackFn = () => {
  if (isProduction) {
    fs.closeSync(fs.openSync("/tmp/app-initialized", "w"));
  }

  console.log(`Listening on ${PORT}`);
};

const torrentFetcher = require("./modules/magnet");

const app = express();
app.enable("trust proxy", 1);
app.use(helmet());
app.use(compression());

app.get("/", async (req, res) => {
  try {
    let decodedUrl = Buffer.from(req.query.url, "base64").toString("ascii");

    if (/magnet:\?xt=urn:[a-z0-9]+:[a-zA-Z0-9]*/.test(decodedUrl)) {
      let { error, torrent } = await torrentFetcher({ magnetLink: decodedUrl });

      if (error) {
        return res
          .status(500)
          .json({ success: false, reason: "MetadataFetchFailure" });
      }

      res.status(200);
      res.set({
        "Content-Type": "application/x-bittorrent",
        "Content-Length": Buffer.byteLength(torrent.torrentFile),
        "Content-Disposition": 'attachment; filename="download.torrent"'
      });

      return res.send(torrent.torrentFile);
    } else {
      return res.status(400).json({ success: false, reason: "InvalidMagnet" });
    }
  } catch (e) {
    return res.status(400).json({ success: false, reason: "InvalidMagnet" });
  }
});

app.listen(PORT, callbackFn);
