// HubScale — Multi-tab sync via BroadcastChannel

let channel = null;
const listeners = new Map();

function getChannel() {
  if (!channel) {
    try {
      channel = new BroadcastChannel('hubscale_sync');
      channel.onmessage = (e) => {
        const { key, data } = e.data || {};
        if (key && listeners.has(key)) {
          listeners.get(key).forEach((fn) => fn(data));
        }
      };
    } catch {
      // BroadcastChannel not supported
    }
  }
  return channel;
}

/** Broadcast a state change to other tabs */
export function broadcast(key, data) {
  const ch = getChannel();
  if (ch) {
    try { ch.postMessage({ key, data }); } catch {}
  }
}

/** Subscribe to changes from other tabs */
export function subscribe(key, callback) {
  getChannel();
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(callback);
  return () => {
    const set = listeners.get(key);
    if (set) {
      set.delete(callback);
      if (set.size === 0) listeners.delete(key);
    }
  };
}
