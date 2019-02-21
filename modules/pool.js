const genericPool = require("generic-pool");

const initWebTorrentPool = ({
  max = 10,
  min = 1,
  idleTimeoutMillis = 30000,
  maxUses = 50,
  testOnBorrow = true,
  maxConns = 3,
  dht = true,
  webSeeds = true,
  validator = () => Promise.resolve(true)
} = {}) => {
  const factory = {
    create: () => {
      let WebTorrent = require("webtorrent");
      WebTorrent.prototype.useCount = 0;

      return new WebTorrent({
        maxConns,
        dht,
        webSeeds
      });
    },
    destroy: instance => {
      instance.destroy();
    },
    validate: instance => {
      return validator(instance).then(valid =>
        Promise.resolve(valid && (maxUses <= 0 || instance.useCount < maxUses))
      );
    }
  };

  const config = {
    max,
    min,
    idleTimeoutMillis,
    testOnBorrow
  };

  const pool = genericPool.createPool(factory, config);
  const genericAcquire = pool.acquire.bind(pool);

  pool.acquire = () =>
    genericAcquire().then(instance => {
      instance.useCount += 1;
      return instance;
    });

  pool.use = fn => {
    let resource = null;

    return pool
      .acquire()
      .then(r => {
        resource = r;
        return resource;
      })
      .then(fn)
      .then(
        result => {
          pool.release(resource);
          return result;
        },
        err => {
          pool.release(resource);
          throw err;
        }
      );
  };

  return pool;
};

module.exports = initWebTorrentPool;
