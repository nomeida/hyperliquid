type NodeRequire = NodeJS.Require;

let cachedRequire: NodeRequire | null = null;
let requireInitialized = false;
let cachedWebSocket: typeof WebSocket | null = null;
let wsInitialized = false;

const getModuleUrl = (): string | undefined => {
  if (typeof __filename !== 'undefined') {
    return __filename;
  }

  if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
    return process.cwd();
  }

  return undefined;
};

export const getNodeRequire = (): NodeRequire | null => {
  if (requireInitialized) {
    return cachedRequire;
  }

  if (typeof require === 'function') {
    cachedRequire = require;
    requireInitialized = true;
    return cachedRequire;
  }

  try {
    const moduleModule = (() => {
      try {
        return eval('module');
      } catch {
        return null;
      }
    })();

    if (moduleModule && typeof moduleModule.createRequire === 'function') {
      const moduleUrl = getModuleUrl();
      if (moduleUrl) {
        cachedRequire = moduleModule.createRequire(moduleUrl) as NodeRequire;
        requireInitialized = true;
        return cachedRequire;
      }
    }
  } catch {
    // Ignore failures and fallback below
  }

  try {
    const mainModuleRequire =
      typeof process !== 'undefined' &&
      process.mainModule &&
      typeof process.mainModule.require === 'function'
        ? process.mainModule.require
        : null;

    if (mainModuleRequire) {
      cachedRequire = mainModuleRequire as NodeRequire;
      requireInitialized = true;
      return cachedRequire;
    }
  } catch {
    // Ignore failures
  }

  requireInitialized = true;
  cachedRequire = null;
  return null;
};

export const loadWsImplementation = (): typeof WebSocket | null => {
  if (wsInitialized) {
    return cachedWebSocket;
  }

  const nodeRequire = getNodeRequire();
  if (!nodeRequire) {
    cachedWebSocket = null;
    wsInitialized = true;
    return cachedWebSocket;
  }

  try {
    const wsModule = nodeRequire('ws');
    const WebSocketImpl = (wsModule && (wsModule.default || wsModule.WebSocket)) || wsModule;

    cachedWebSocket =
      typeof WebSocketImpl === 'function' ? (WebSocketImpl as typeof WebSocket) : null;
    wsInitialized = true;
  } catch {
    wsInitialized = true;
    cachedWebSocket = null;
  }

  return cachedWebSocket;
};

export const cacheWsImplementation = (impl: typeof WebSocket | null): void => {
  wsInitialized = true;
  cachedWebSocket = impl;
};
