const WebTorrent = require('webtorrent');
const https = require('https');
const path = require('path');

class TorrentEngine {
  constructor() {
    this.client = new WebTorrent();
    this.additionalTrackers = [];
    this.fetchAdditionalTrackers();
    this.downloadPath = path.join(__dirname, '../cache/torrentCache');
  }
  getAllTorrentData() {
    return this.client.torrents.reduce((torrents, torrent) => {
      torrents.push(this.getTorrentDetails(torrent.infoHash));
      return torrents;
    }, []);
  }
  fetchAdditionalTrackers() {
    https.get(
      'https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_best.txt',
      response => {
        let data = '';
        response.on('data', chunk => {
          data += chunk;
        });
        response.on('end', () => {
          this.additionalTrackers = data
            .split('\n')
            .filter(tracker => tracker)
            .reduce((trackerArray, tracker) => {
              trackerArray.push(tracker);
              return trackerArray;
            }, []);
        });
      }
    );
  }

  checkTorrentExists(infoHash) {
    return this.client.get(infoHash);
  }

  addTorrent(magnet) {
    // Adds a new torrent to the client. If the client already exists
    return new Promise(resolve => {
      const existingTorrent = this.client.get(magnet);
      if (existingTorrent) {
        resolve(existingTorrent.infoHash);
      } else {
        this.client.add(
          magnet,
          { announce: this.additionalTrackers, path: this.downloadPath },
          torrent => {
            resolve(torrent.infoHash);
          }
        );
      }
    });
  }

  getTorrentDetails(infoHash) {
    const torrent = this.client.get(infoHash);
    if (!torrent) return {};
    return {
      name: torrent.name,
      infoHash: torrent.infoHash,
      files: torrent.files.reduce((files, file) => {
        files.push({
          name: file.name,
          size: file.length,
          downloaded: file.downloaded,
          progress: file.progress
        });
        return files;
      }, []),
      timeRemaining: torrent.timeRemaining,
      received: torrent.received,
      downloaded: torrent.downloaded,
      uploaded: torrent.uploaded,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      progress: torrent.progress,
      ratio: torrent.ratio,
      peers: torrent.peers
    };
  }
  getStreamableFile(infoHash) {
    const torrent = this.client.get(infoHash);
    if (torrent) {
      let currentMaxSize = 0;
      return torrent.files.reduce((selectedFile, file) => {
        if (file.name.split('.').pop() === 'mp4') {
          if (file.length > currentMaxSize) {
            selectedFile = file;
          }
        }
        return selectedFile;
      }, null);
    } else {
      return false;
    }
  }
}

module.exports = TorrentEngine;
