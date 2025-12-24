

export enum SquareType {
  START = 'START',
  PROPERTY = 'PROPERTY',
  CHANCE = 'CHANCE',
  COMMUNITY = 'COMMUNITY',
  JAIL = 'JAIL',
  FREE_PARKING = 'FREE_PARKING',
  GO_TO_JAIL = 'GO_TO_JAIL',
  TAX = 'TAX',
  UTILITY = 'UTILITY',
  RAILROAD = 'RAILROAD'
}

export interface Square {
  id: number;
  name: string;
  type: SquareType;
  price?: number;
  rent?: number[]; // [base, 1house, 2house, 3house, 4house, hotel]
  houseCost?: number;
  colorGroup?: string; // CSS hex or class
  owner?: string; // Player ID of the owner
  houses?: number; // 0 = no house, 5 = hotel
  isMortgaged?: boolean;
  amount?: number; // For tax squares
  position?: number; // For movement effects
  action?: string; // For chance/community cards
  effect?: {
    type: 'move' | 'money' | 'jail' | 'get_out_of_jail';
    position?: number;
    amount?: number;
  };
}

export interface Player {
  id: string;
  name: string;
  color: string; // Hex code for token
  isAi: boolean; // Flag for Computer players
  money: number;
  position: number;
  isBankrupt: boolean;
  inJail: boolean;
  jailTurns: number;
  properties: number[]; // Array of square IDs owned by the player
  bankruptedBy?: string; // ID of player who bankrupted this player
  getOutOfJailFreeCards: number; // Number of get out of jail free cards
}

export interface LogEntry {
  text: string;
  type: 'info' | 'success' | 'error' | 'event';
  time: string;
}

export interface Card {
  id: number;
  text: string;
  effect?: {
    type: 'move' | 'money' | 'jail' | 'get_out_of_jail';
    position?: number;
    amount?: number;
  };
  amount?: number;
  move?: number;
  action?: string;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  squares: Square[];
  diceValue: [number, number]; // [die1, die2]
  gamePhase: 'SETUP' | 'PLAYING' | 'GAME_OVER';
  logs: LogEntry[];
  showModal: {
    type: 'CHANCE' | 'COMMUNITY' | 'INFO' | 'BUY' | 'BANKRUPT' | 'UPGRADE' | 'CARD' | null;
    title?: string;
    message?: string;
    data?: any;
  };
  gameDuration: number; // in minutes, -1 for unlimited
  timeLeft: number; // in seconds
  votesToEnd: string[]; // Array of player IDs who voted to end
  currentPlayerId?: string; // ID of the current player (for multiplayer)
}