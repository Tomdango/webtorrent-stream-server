const router = require('express').Router();
const TorrentEngine = new (require('../lib/torrentEngine'))();
const pJSON = require('../package.json');

router.get('/dashboard-data', async (req, res) => {
  res.send({ version: pJSON.version, torrents: await TorrentEngine.getAllTorrentData() });
});

router.post('/add', async (req, res) => {
  if (!req.body.torrent) {
    res.status(400);
    return res.send({ status: 'ERROR', message: 'No Magnet URI supplied in request body.' });
  } else if (typeof req.body.torrent !== 'string') {
    res.status(400);
    return res.send({
      status: 'ERROR',
      message: 'Invalid Magnet URI supplied in request body. Link must be a string.'
    });
  } else if (!req.body.torrent.match(/magnet:\?xt=urn:btih:[a-zA-Z0-9]*/)) {
    res.status(400);
    return res.send({
      status: 'ERROR',
      message: 'Invalid Magnet URI supplied in request body.'
    });
  }
  try {
    const infoHash = await TorrentEngine.addTorrent(req.body.torrent);
    res.status(200);
    res.send({ status: 'SUCCESS', message: 'Magnet URI successfully added.', data: { infoHash } });
  } catch (error) {
    res.status(500);
    res.send({
      status: 'ERROR',
      message: 'Error when adding Magnet Link',
      data: { error: error.toString() }
    });
  }
});

router.get('/details/:hash', (req, res) => {
  res.send(TorrentEngine.getTorrentDetails(req.params.hash));
});

router.get('/stream/:hash', async (req, res) => {
  const streamableFile = await TorrentEngine.getStreamableFile(req.params.hash);
  if (streamableFile) {
    const totalBytes = streamableFile.length;
    if (req.headers.range) {
      const range = req.headers.range;
      const parts = range.replace(/bytes=/, '').split('-');
      const partialStart = parts[0];
      const partialEnd = parts[1];
      const startBytes = parseInt(partialStart, 10);
      const endBytes = partialEnd ? parseInt(partialEnd, 10) : totalBytes - 1;
      const chunkSize = endBytes - startBytes + 1;
      const stream = streamableFile.createReadStream({ start: startBytes, end: endBytes });
      res.writeHead(206, {
        'Content-Range': `bytes ${startBytes}-${endBytes}/${totalBytes}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4'
      });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalBytes,
        'Content-Type': 'video/mp4'
      });
      streamableFile.createReadStream().pipe(res);
    }
  } else {
    res.status(400);
    res.send({ status: 'ERROR', message: 'No file available for streaming.' });
  }
});
module.exports = router;
