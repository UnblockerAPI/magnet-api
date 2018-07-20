const initWebTorrentPool = require("./pool");
const pool = initWebTorrentPool();

module.exports = async ({ magnetLink }) => {
    return new Promise((result, reject) => {
        pool.use(async torrentClient => {
            let { error, torrent } = await new Promise(resolve => {
                torrentClient.on('error', () => {
                    resolve({ error: true, torrent: null });
                });

                torrentClient.on('torrent', torrentObject => {
                    torrentClient.destroy();
                    resolve({ error: false, torrent: torrentObject });
                });

                torrentClient.add(magnetLink);
                setTimeout(
                    function() {
                        torrentClient.destroy();
                        resolve({ error: true, torrent: null });
                    },
                    15000
                );
            });

            result({ error, torrent });
        });
    });
};
