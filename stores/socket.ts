import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface SubscribedMachine {
  id: string;
  name: string;
}

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  subscribedMachineIds: Set<string>;
  isAdminSubscription: boolean;
}

interface SocketActions {
  connect: () => void;
  disconnect: () => void;
  subscribeToMachines: (machines: SubscribedMachine[], isAdmin?: boolean) => void;
  getSocket: () => Socket | null;
}

export const useSocketStore = create<SocketState & SocketActions>((set, get) => ({
  socket: null,
  isConnected: false,
  subscribedMachineIds: new Set(),
  isAdminSubscription: false,

  connect: () => {
    const { socket } = get();
    
    // Don't create a new connection if one already exists
    if (socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL as string, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Handle tab/window close - disconnect socket
    const handleBeforeUnload = () => {
      console.log("Tab closing, disconnecting socket...");
      newSocket.disconnect();
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);

    newSocket.on("connect", () => {
      console.log("Global socket connected:", newSocket.id);
      set({ isConnected: true });
      
      // Re-subscribe to machines on reconnect
      const { subscribedMachineIds, isAdminSubscription } = get();
      subscribedMachineIds.forEach((machineId) => {
        newSocket.emit("subscribe_machine", { machineId, isAdmin: isAdminSubscription });
        console.log(`Re-subscribed to machine: ${machineId}${isAdminSubscription ? ' (admin)' : ''}`);
      });
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Global socket disconnected:", reason);
      set({ isConnected: false });
    });

    newSocket.on("connect_error", (error) => {
      console.error("Global socket connection error:", error.message);
    });

    // Store cleanup function reference
    (newSocket as any)._cleanupBeforeUnload = handleBeforeUnload;

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      // Remove beforeunload listener
      const cleanupFn = (socket as any)._cleanupBeforeUnload;
      if (cleanupFn) {
        window.removeEventListener("beforeunload", cleanupFn);
      }
      socket.disconnect();
      set({ socket: null, isConnected: false, subscribedMachineIds: new Set() });
    }
  },

  subscribeToMachines: (machines, isAdmin) => {
    const { socket, subscribedMachineIds } = get();
    
    if (!socket?.connected) {
      console.warn("Socket not connected, cannot subscribe to machines");
      return;
    }

    const newSubscribedIds = new Set(subscribedMachineIds);
    
    machines.forEach((machine) => {
      // Only subscribe if not already subscribed
      if (!subscribedMachineIds.has(machine.id)) {
        socket.emit("subscribe_machine", { machineId: machine.id, isAdmin });
        newSubscribedIds.add(machine.id);
        console.log(`Subscribed to machine: ${machine.name} (${machine.id})${isAdmin ? ' (admin)' : ''}`);
      }
    });

    set({ subscribedMachineIds: newSubscribedIds, isAdminSubscription: !!isAdmin });
  },

  getSocket: () => get().socket,
}));
