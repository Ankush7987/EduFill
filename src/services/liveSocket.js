import { io } from 'socket.io-client';
import { LIVE_API_BASE } from './liveConfig';

export const LIVE_SOCKET_EVENTS = {
  REQUEST_SEARCHING: 'live:request_searching',
  REQUEST_ACCEPTED: 'live:request_accepted',
  REQUEST_COMPLETED: 'live:request_completed',
  REQUEST_CANCELLED: 'live:request_cancelled',
  OFFER_NEW: 'live:offer_new',
};

let liveSocket = null;

export const getLiveSocket = () => {
  if (!liveSocket) {
    liveSocket = io(LIVE_API_BASE, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }

  return liveSocket;
};

export const connectLiveSocket = () => {
  const socket = getLiveSocket();

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const registerLiveStudent = (userId) => {
  if (!userId) return;

  const socket = connectLiveSocket();
  socket.emit('live_register_student', { userId });
};

export const registerLiveAgent = (employeeId) => {
  if (!employeeId) return;

  const socket = connectLiveSocket();
  socket.emit('live_register_agent', { employeeId });
};

export const subscribeStudentLiveEvents = ({
  onSearching,
  onAccepted,
  onCompleted,
  onCancelled,
}) => {
  const socket = connectLiveSocket();

  if (onSearching) socket.on(LIVE_SOCKET_EVENTS.REQUEST_SEARCHING, onSearching);
  if (onAccepted) socket.on(LIVE_SOCKET_EVENTS.REQUEST_ACCEPTED, onAccepted);
  if (onCompleted) socket.on(LIVE_SOCKET_EVENTS.REQUEST_COMPLETED, onCompleted);
  if (onCancelled) socket.on(LIVE_SOCKET_EVENTS.REQUEST_CANCELLED, onCancelled);

  return () => {
    if (onSearching) socket.off(LIVE_SOCKET_EVENTS.REQUEST_SEARCHING, onSearching);
    if (onAccepted) socket.off(LIVE_SOCKET_EVENTS.REQUEST_ACCEPTED, onAccepted);
    if (onCompleted) socket.off(LIVE_SOCKET_EVENTS.REQUEST_COMPLETED, onCompleted);
    if (onCancelled) socket.off(LIVE_SOCKET_EVENTS.REQUEST_CANCELLED, onCancelled);
  };
};

export const subscribeAgentLiveEvents = ({
  onOfferNew,
  onAccepted,
  onCompleted,
  onCancelled,
}) => {
  const socket = connectLiveSocket();

  if (onOfferNew) socket.on(LIVE_SOCKET_EVENTS.OFFER_NEW, onOfferNew);
  if (onAccepted) socket.on(LIVE_SOCKET_EVENTS.REQUEST_ACCEPTED, onAccepted);
  if (onCompleted) socket.on(LIVE_SOCKET_EVENTS.REQUEST_COMPLETED, onCompleted);
  if (onCancelled) socket.on(LIVE_SOCKET_EVENTS.REQUEST_CANCELLED, onCancelled);

  return () => {
    if (onOfferNew) socket.off(LIVE_SOCKET_EVENTS.OFFER_NEW, onOfferNew);
    if (onAccepted) socket.off(LIVE_SOCKET_EVENTS.REQUEST_ACCEPTED, onAccepted);
    if (onCompleted) socket.off(LIVE_SOCKET_EVENTS.REQUEST_COMPLETED, onCompleted);
    if (onCancelled) socket.off(LIVE_SOCKET_EVENTS.REQUEST_CANCELLED, onCancelled);
  };
};