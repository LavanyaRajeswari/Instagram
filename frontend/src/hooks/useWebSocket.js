import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import { BACKEND_BASE_URL, getAuthToken } from "../api/client";
import SockJS from "sockjs-client";

const WS_URL = import.meta.env.VITE_WS_URL || `${BACKEND_BASE_URL}/ws`;

const subCallbacks = {};
let sharedClient = null;
let pendingMessages = [];
let isConnecting = false;
let pendingCallSignals = [];

export function bufferCallSignal(signal) {
  pendingCallSignals.push(signal);
}

export function drainCallSignals(callId) {
  const matched = pendingCallSignals.filter((s) => String(s.callId) === String(callId));
  pendingCallSignals = pendingCallSignals.filter((s) => String(s.callId) !== String(callId));
  return matched;
}

function dispatchToCallbacks(cbMap, msg) {
  Object.entries(cbMap).forEach(([key, cb]) => {
    if (key !== "sub" && typeof cb === "function") cb(msg);
  });
}

function getClient() {
  if (!sharedClient) {
    sharedClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      onConnect: () => {
        isConnecting = false;
        Object.entries(subCallbacks).forEach(([destination, cbMap]) => {
          if (!cbMap.sub) {
            cbMap.sub = doSubscribe(destination, (msg) => dispatchToCallbacks(cbMap, msg));
          }
        });
        const messages = pendingMessages;
        pendingMessages = [];
        messages.forEach(({ destination, body }) => {
          sharedClient.publish({
            destination: "/app" + destination,
            body: JSON.stringify(body),
          });
        });
      },
      onDisconnect: () => {
        isConnecting = false;
      },
      onStompError: (frame) => {
        isConnecting = false;
        console.warn("[WS] STOMP error:", frame?.headers?.message || frame);
      },
      onWebSocketClose: () => {
        isConnecting = false;
        Object.values(subCallbacks).forEach((cbMap) => {
          delete cbMap.sub;
        });
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });
  }
  return sharedClient;
}

function doSubscribe(destination, callback) {
  if (!sharedClient || !sharedClient.connected) return () => {};
  const sub = sharedClient.subscribe(destination, (message) => {
    try {
      callback(JSON.parse(message.body));
    } catch {
      callback(message.body);
    }
  });
  return () => {
    try { sub.unsubscribe(); } catch {}
  };
}

export function connect() {
  const client = getClient();
  if (!client.connected && !client.active) {
    isConnecting = true;
    client.activate();
  }
}

export function disconnect() {
  if (sharedClient && sharedClient.connected) {
    sharedClient.deactivate();
    sharedClient = null;
  }
}

export function subscribe(destination, callback) {
  const unsubKey = destination + "_" + String(Math.random()).slice(2);

  if (!subCallbacks[destination]) {
    subCallbacks[destination] = {};
  }
  subCallbacks[destination][unsubKey] = callback;

  if (sharedClient && sharedClient.connected) {
    if (!subCallbacks[destination].sub) {
      const cbMap = subCallbacks[destination];
      subCallbacks[destination].sub = doSubscribe(destination, (msg) => dispatchToCallbacks(cbMap, msg));
    }
  } else {
    if (!isConnecting) connect();
  }

  return () => {
    if (subCallbacks[destination]) {
      delete subCallbacks[destination][unsubKey];
      const remaining = Object.keys(subCallbacks[destination]).filter((k) => k !== "sub");
      if (remaining.length === 0 && subCallbacks[destination].sub) {
        try { subCallbacks[destination].sub(); } catch {}
        delete subCallbacks[destination];
      }
    }
  };
}

export function send(destination, body = {}) {
  if (sharedClient && sharedClient.connected) {
    sharedClient.publish({
      destination: "/app" + destination,
      body: JSON.stringify(body),
    });
  } else {
    pendingMessages.push({ destination, body });
    connect();
  }
}

export function useWebSocket() {
  const connectedRef = useRef(false);

  useEffect(() => {
    connect();
    const checkConnected = setInterval(() => {
      connectedRef.current = sharedClient?.connected ?? false;
    }, 1000);
    return () => {
      clearInterval(checkConnected);
    };
  }, []);

  const subscribeWs = useCallback((destination, callback) => {
    return subscribe(destination, callback);
  }, []);

  const sendWs = useCallback((destination, body) => {
    send(destination, body);
  }, []);

  return { subscribe: subscribeWs, send: sendWs, connected: connectedRef.current };
}

export function subscribeToNotifications(callback) {
  return subscribe("/user/queue/notifications", callback);
}

export function subscribeToChat(chatId, callback) {
  return subscribe(`/topic/chat/${chatId}`, callback);
}

export function subscribeToTyping(chatId, callback) {
  return subscribe(`/topic/chat/${chatId}/typing`, callback);
}

export function sendTyping(chatId, userId, typing) {
  send("/chat.typing", { chatId, userId, typing });
}

export function sendChatMessage(chatId, content, messageType = "TEXT") {
  send("/chat.send", { chatId, content, messageType });
}

export function subscribeToGroup(groupId, callback) {
  return subscribe(`/topic/group/${groupId}`, callback);
}

export function subscribeToCall(userId, callback) {
  return subscribe(`/queue/call/${userId}`, callback);
}

export function sendCallOffer(payload) {
  send("/call.offer", payload);
}

export function sendCallAnswer(payload) {
  send("/call.answer", payload);
}

export function sendIceCandidate(payload) {
  send("/call.ice-candidate", payload);
}

export function sendCallEnd(payload) {
  send("/call.end", payload);
}
