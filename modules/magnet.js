const initWebTorrentPool = require("./pool");
const pool = initWebTorrentPool();

module.exports = async ({ magnetLink }) => {
  return new Promise((result, reject) => {
    pool.use(async torrentClient => {
      let { error, torrent } = await new Promise(resolve => {
        let autoRemoveTimer = setTimeout(() => {
          torrentClient.remove(magnetLink);
          resolve({ error: true, torrent: null });
        }, 25000);

        torrentClient.add(magnetLink, torrentObject => {
          clearTimeout(autoRemoveTimer);

          torrentClient.remove(magnetLink);
          resolve({ error: false, torrent: torrentObject });
        });

        torrentClient.on("error", () => {
          clearTimeout(autoRemoveTimer);

          torrentClient.remove(magnetLink);
          resolve({ error: true, torrent: null });
        });
      });

      result({ error, torrent });
    });
  });
};
