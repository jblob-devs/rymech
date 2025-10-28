import Peer, { DataConnection } from 'peerjs';
import { GameState, Player, Vector2, RemotePlayer } from '../types/game';

export type MultiplayerRole = 'host' | 'client' | 'none';

export interface PlayerInput {
  keys: string[];
  mousePos: Vector2;
  mouseDown: boolean;
  timestamp: number;
  playerId: string;
  activeWeaponIndex?: number;
  username?: string;
}

export interface GameStateUpdate {
  type: 'state_update';
  state: Partial<GameState>;
  timestamp: number;
}

export interface PlayerInputMessage {
  type: 'player_input';
  input: PlayerInput;
}

export interface PlayerJoinMessage {
  type: 'player_join';
  playerId: string;
  playerData: Player;
}

export interface PlayerLeaveMessage {
  type: 'player_leave';
  playerId: string;
}

export interface WorldInitMessage {
  type: 'world_init';
  worldData: any;
  timestamp: number;
}

export type NetworkMessage = 
  | GameStateUpdate 
  | PlayerInputMessage 
  | PlayerJoinMessage 
  | PlayerLeaveMessage
  | WorldInitMessage;

export class MultiplayerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private role: MultiplayerRole = 'none';
  private peerId: string = '';
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private lastInputs: Map<string, PlayerInput> = new Map();
  private onStateUpdateCallback?: (state: Partial<GameState>) => void;
  private onPlayerInputCallback?: (input: PlayerInput) => void;
  private onConnectionChangeCallback?: () => void;
  private onWorldInitCallback?: (worldData: any) => void;
  private onClientConnectedCallback?: (peerId: string) => void;
  private worldInitialized: boolean = false;

  constructor() {}

  async createGame(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });

      this.peer.on('open', (id) => {
        this.peerId = id;
        this.role = 'host';
        console.log('Game created with ID:', id);
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.handleIncomingConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        reject(err);
      });
    });
  }

  async joinGame(hostId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });

      this.peer.on('open', (id) => {
        this.peerId = id;
        this.role = 'client';
        console.log('Connecting to host:', hostId);

        const conn = this.peer!.connect(hostId, {
          reliable: true,
        });

        conn.on('open', () => {
          console.log('Connected to host');
          this.connections.set(hostId, conn);
          this.setupConnectionHandlers(conn);
          resolve();
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
          reject(err);
        });
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        reject(err);
      });
    });
  }

  private handleIncomingConnection(conn: DataConnection) {
    console.log('Incoming connection from:', conn.peer);
    
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.setupConnectionHandlers(conn);
      
      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback();
      }

      if (this.onClientConnectedCallback) {
        this.onClientConnectedCallback(conn.peer);
      }
    });
  }

  private setupConnectionHandlers(conn: DataConnection) {
    conn.on('data', (data) => {
      this.handleMessage(data as NetworkMessage, conn.peer);
    });

    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      this.remotePlayers.delete(conn.peer);
      
      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback();
      }
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
    });
  }

  private handleMessage(message: NetworkMessage, fromPeerId: string) {
    switch (message.type) {
      case 'state_update':
        if (this.role === 'client' && this.worldInitialized && this.onStateUpdateCallback) {
          this.onStateUpdateCallback(message.state);
        }
        break;
      
      case 'player_input':
        if (this.role === 'host' && this.onPlayerInputCallback) {
          this.lastInputs.set(fromPeerId, message.input);
          this.onPlayerInputCallback(message.input);
        }
        break;
      
      case 'player_join':
        const remotePlayer: RemotePlayer = {
          id: message.playerId,
          peerId: fromPeerId,
          player: message.playerData,
          lastUpdate: Date.now(),
        };
        this.remotePlayers.set(fromPeerId, remotePlayer);
        break;
      
      case 'player_leave':
        this.remotePlayers.delete(fromPeerId);
        break;
      
      case 'world_init':
        if (this.role === 'client' && this.onWorldInitCallback) {
          console.log('Received world initialization data');
          this.onWorldInitCallback(message.worldData);
          this.worldInitialized = true;
        }
        break;
    }
  }

  sendPlayerInput(input: PlayerInput) {
    if (this.role !== 'client') return;

    const message: PlayerInputMessage = {
      type: 'player_input',
      input,
    };

    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  broadcastGameState(state: Partial<GameState>) {
    if (this.role !== 'host') return;

    const message: GameStateUpdate = {
      type: 'state_update',
      state,
      timestamp: Date.now(),
    };

    this.connections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(message);
        } catch (err) {
          console.error('Error sending state to', conn.peer, err);
        }
      }
    });
  }

  announcePlayerJoin(playerId: string, playerData: Player) {
    const message: PlayerJoinMessage = {
      type: 'player_join',
      playerId,
      playerData,
    };

    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  getRemotePlayers(): RemotePlayer[] {
    return Array.from(this.remotePlayers.values());
  }

  getRole(): MultiplayerRole {
    return this.role;
  }

  getPeerId(): string {
    return this.peerId;
  }

  isConnected(): boolean {
    return this.connections.size > 0;
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  onStateUpdate(callback: (state: Partial<GameState>) => void) {
    this.onStateUpdateCallback = callback;
  }

  onPlayerInput(callback: (input: PlayerInput) => void) {
    this.onPlayerInputCallback = callback;
  }

  onConnectionChange(callback: () => void) {
    this.onConnectionChangeCallback = callback;
  }

  onWorldInit(callback: (worldData: any) => void) {
    this.onWorldInitCallback = callback;
  }

  onClientConnected(callback: (peerId: string) => void) {
    this.onClientConnectedCallback = callback;
  }

  sendWorldInit(worldData: any, toPeerId?: string) {
    if (this.role !== 'host') return;

    const message: WorldInitMessage = {
      type: 'world_init',
      worldData,
      timestamp: Date.now(),
    };

    if (toPeerId) {
      const conn = this.connections.get(toPeerId);
      if (conn && conn.open) {
        try {
          console.log('Sending world init to', toPeerId);
          conn.send(message);
        } catch (err) {
          console.error('Error sending world init to', toPeerId, err);
        }
      }
    } else {
      this.connections.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send(message);
          } catch (err) {
            console.error('Error sending world init to', conn.peer, err);
          }
        }
      });
    }
  }

  isWorldInitialized(): boolean {
    return this.worldInitialized || this.role === 'host';
  }

  disconnect() {
    this.connections.forEach((conn) => {
      conn.close();
    });
    this.connections.clear();
    this.remotePlayers.clear();
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    this.role = 'none';
    this.peerId = '';
    this.worldInitialized = false;
  }
}
