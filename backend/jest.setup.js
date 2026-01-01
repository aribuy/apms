const http = require('http');

const originalListen = http.Server.prototype.listen;

http.Server.prototype.listen = function (...args) {
  if (args.length === 0) {
    return originalListen.call(this);
  }

  const [port, host, ...rest] = args;

  if (host === undefined || typeof host === 'function') {
    const callback = typeof host === 'function' ? host : undefined;
    const remaining = typeof host === 'function' ? rest : [host, ...rest];
    return originalListen.call(this, port, '127.0.0.1', ...remaining, callback);
  }

  return originalListen.call(this, port, host, ...rest);
};
