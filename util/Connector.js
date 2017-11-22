/* eslint-disable no-param-reassign */
// TODO: Reimplement this to avoid mutating requester
const WS = require('ws');

const createSocket = requester => new Promise(((resolve, reject) => {
  if (requester && requester.CONNECTOR_TYPE) {
    const type = requester.CONNECTOR_TYPE;
    const PATH = requester.CONNECTOR_PATH;
    const PORT = requester.CONNECTOR_PORT;
    const HOST = requester.CONNECTOR_HOST;
    if (type === 'SERVER') {
      requester.socket = new WS.Server({ host: HOST, port: PORT });
      resolve(true);
    } else if (type === 'CLIENT') {
      if (PATH || (PORT && HOST)) {
        requester.socket = new WS('https://insight.dash.siampm.com/socket.io/?EIO=2&transport=polling&t=1491974880972-0');
        requester.socket.on('open', () =>
          resolve(true));
        requester.socket.on('error', () => {
          console.log('Can\' connect');
          resolve(false);
        });
      } else {
        console.log('Missing element to perform a socket client', 'HOST:', HOST, '-PORT:', PORT);
        resolve(false);
      }
    } else {
      reject(new Error('Unabled to create socket. Wrong type', type));
    }
  } else {
    reject(new Error('Unabled to create socket. No type assigned'));
  }
}));

const retryConnect = (requester, Connector) => {
  if (requester && requester.type && requester.socket) {
    requester.socket.on('error', () => {
    });
    requester.socket.on('close', (statusCode, reason) => {
      console.log(statusCode, reason);
      const tryConnect = () => {
        if (requester.socket.readyState === 3) {
          Connector.createSocket(requester);
          Connector.retryConnect(requester);
        }
      };
      const checkInterval = setInterval(() => {
        if (requester.socket.readyState === 3) {
          tryConnect();
        } else {
          clearInterval(checkInterval);
        }
      }, 1000);
      tryConnect();
    });
  }
};

module.exports = {
  createSocket,
  retryConnect,
};
