import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
  : 'https://agente-backend.amxxqr.easypanel.host';

// Singleton socket — uma única conexão para toda a app
let _socket = null;

function getSocket() {
  if (!_socket) {
    _socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return _socket;
}

/**
 * Hook para ouvir eventos do Socket.io.
 *
 * @param {string | string[]} events  - Nome(s) do evento para ouvir
 * @param {Function}          handler - Callback chamado com o payload do evento
 *
 * Uso:
 *   useSocket('appointment_concluido', (data) => { ... refetch(); });
 *   useSocket(['financial_new', 'financial_updated'], handler);
 */
export function useSocket(events, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const evList = Array.isArray(events) ? events : [events];

    const wrappedHandler = (...args) => handlerRef.current(...args);

    evList.forEach((ev) => socket.on(ev, wrappedHandler));

    return () => {
      evList.forEach((ev) => socket.off(ev, wrappedHandler));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(events)]);
}

export default useSocket;
