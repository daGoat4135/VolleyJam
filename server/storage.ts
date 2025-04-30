import { 
  players, type Player, type InsertPlayer,
  matches, type Match, type InsertMatch,
  sets, type Set, type InsertSet, type UpdateSet,
  gameLogs, type GameLog, type InsertGameLog,
  users, type User, type InsertUser 
} from "@shared/schema";
import { ratingEngine } from './ratingEngine';

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Players
  getPlayers(): Promise<Player[]>;
  getPlayersByDivision(division: string): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  
  // Matches
  getMatches(): Promise<Match[]>;
  getMatch(id: number): Promise<Match | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, data: Partial<Match>): Promise<Match>;
  
  // Sets
  getSets(matchId: number): Promise<Set[]>;
  getSet(id: number): Promise<Set | undefined>;
  createSet(set: InsertSet): Promise<Set>;
  updateSet(id: number, data: UpdateSet): Promise<Set>;
  
  // Game Logs
  getGameLogs(matchId: number): Promise<GameLog[]>;
  createGameLog(gameLog: InsertGameLog): Promise<GameLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private players: Map<number, Player>;
  private matches: Map<number, Match>;
  private sets: Map<number, Set>;
  private gameLogs: Map<number, GameLog>;
  
  private userCurrentId: number;
  private playerCurrentId: number;
  private matchCurrentId: number;
  private setCurrentId: number;
  private gameLogCurrentId: number;

  constructor() {
    this.users = new Map();
    this.players = new Map();
    this.matches = new Map();
    this.sets = new Map();
    this.gameLogs = new Map();
    
    this.userCurrentId = 1;
    this.playerCurrentId = 1;
    this.matchCurrentId = 1;
    this.setCurrentId = 1;
    this.gameLogCurrentId = 1;
    
    // Initialize with some sample players
    this.initializePlayers();
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Players
  async getPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }
  
  async getPlayersByDivision(division: string): Promise<Player[]> {
    return Array.from(this.players.values()).filter(
      player => player.division.toLowerCase() === division.toLowerCase()
    );
  }
  
  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }
  
  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.playerCurrentId++;
    const player: Player = { 
      ...insertPlayer, 
      id,
      rating: ratingEngine.getInitialRating().rating,
      ratingDeviation: ratingEngine.getInitialRating().ratingDeviation,
      volatility: ratingEngine.getInitialRating().volatility
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: number, ratingData: { rating: number; ratingDeviation: number; volatility: number }): Promise<Player> {
    const player = this.players.get(id);
    if (!player) {
      throw new Error(`Player with id ${id} not found`);
    }
    
    const updatedPlayer = { 
      ...player, 
      rating: ratingData.rating,
      ratingDeviation: ratingData.ratingDeviation,
      volatility: ratingData.volatility
    };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }
  
  // Matches
  async getMatches(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }
  
  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }
  
  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.matchCurrentId++;
    const now = new Date();
    const match: Match = { 
      ...insertMatch, 
      id, 
      createdAt: now, 
      isComplete: false,
      winningDivision: null,
      mvpPlayerId: null
    };
    this.matches.set(id, match);
    return match;
  }
  
  async updateMatch(id: number, data: Partial<Match>): Promise<Match> {
    const match = this.matches.get(id);
    if (!match) {
      throw new Error(`Match with id ${id} not found`);
    }
    
    const updatedMatch = { ...match, ...data };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }
  
  // Sets
  async getSets(matchId: number): Promise<Set[]> {
    return Array.from(this.sets.values()).filter(
      set => set.matchId === matchId
    );
  }
  
  async getSet(id: number): Promise<Set | undefined> {
    return this.sets.get(id);
  }
  
  async createSet(insertSet: InsertSet): Promise<Set> {
    const id = this.setCurrentId++;
    const set: Set = { 
      ...insertSet, 
      id, 
      westScore: 0, 
      eastScore: 0, 
      winningDivision: null,
      isComplete: false 
    };
    this.sets.set(id, set);
    return set;
  }
  
  async updateSet(id: number, data: UpdateSet): Promise<Set> {
    const set = this.sets.get(id);
    if (!set) {
      throw new Error(`Set with id ${id} not found`);
    }
    
    const updatedSet = { ...set, ...data };
    this.sets.set(id, updatedSet);
    return updatedSet;
  }
  
  // Game Logs
  async getGameLogs(matchId: number): Promise<GameLog[]> {
    return Array.from(this.gameLogs.values())
      .filter(log => log.matchId === matchId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  async createGameLog(insertGameLog: InsertGameLog): Promise<GameLog> {
    const id = this.gameLogCurrentId++;
    const now = new Date();
    const gameLog: GameLog = { ...insertGameLog, id, timestamp: now };
    this.gameLogs.set(id, gameLog);
    return gameLog;
  }
  
  private initializePlayers(): void {
    // West Division Players
    const westPlayers: InsertPlayer[] = [
      {
        name: "ALEX",
        division: "west",
        team: "SEATTLE",
        speed: 7,
        power: 8,
        avatarUrl: "https://ca.slack-edge.com/E7AN7J5RP-W8FHWAD19-28509fcb8054-512?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "AMBER",
        division: "west",
        team: "SEATTLE",
        speed: 6,
        power: 9,
        avatarUrl: "https://ca.slack-edge.com/E7AN7J5RP-W01BWS0968H-9d7cc2932f41-512?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "ANTHONY",
        division: "west",
        team: "SACRAMENTO",
        speed: 9,
        power: 6,
        avatarUrl: "https://ca.slack-edge.com/E7AN7J5RP-U049L0V1ZSM-89445ae504c8-512?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "BILLY",
        division: "west",
        team: "SACRAMENTO",
        speed: 8,
        power: 7,
        avatarUrl: "https://ca.slack-edge.com/E7AN7J5RP-W8F0QRF32-56e733279250-512?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "DANNY",
        division: "west",
        team: "GOLDEN STATE",
        speed: 8,
        power: 7,
        avatarUrl: "https://ca.slack-edge.com/E7AN7J5RP-U02V7C547TJ-2a97e6c82408-512?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "HUGO",
        division: "west",
        team: "LA LAKERS",
        speed: 6,
        power: 10,
        avatarUrl: "https://ca.slack-edge.com/E7AN7J5RP-WPC6TL33P-29d2763b9c38-512?w=150&h=150&auto=format&fit=crop&q=80"
      }
    ];
    
    // East Division Players
    const eastPlayers: InsertPlayer[] = [
      {
        name: "JM",
        division: "east",
        team: "INDIANA",
        speed: 8,
        power: 7,
        avatarUrl: "https://ca.slack-edge.com/E7AN7J5RP-W8F0TABBJ-3de64a384b81-512?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "JORDAN",
        division: "east",
        team: "INDIANA",
        speed: 6,
        power: 9,
        avatarUrl: "https://ca.slack-edge.com/E7AN7J5RP-WTH67L4M8-b9cc0a965acc-512?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "KELLY",
        division: "east",
        team: "CHARLOTTE",
        speed: 7,
        power: 8,
        avatarUrl: "https://ca.slack-edge.com/E7AN7J5RP-W8F0SAHQ8-fa079931a311-512?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "KYLE",
        division: "east",
        team: "BOSTON",
        speed: 9,
        power: 6,
        avatarUrl: "https://ca.slack-edge.com/E7AN7J5RP-WHUR0AGLE-f788dffb71dc-512?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "MARK",
        division: "east",
        team: "CHICAGO",
        speed: 8,
        power: 8,
        avatarUrl: "https://ca.slack-edge.com/E7AN7J5RP-U07KUEPJ0QL-76c32e407abf-512?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "SACHIN",
        division: "east",
        team: "DETROIT",
        speed: 10,
        power: 5,
        avatarUrl: "https://ca.slack-edge.com/E7AN7J5RP-U088E4ZV4EB-g13c95566286-512?w=150&h=150&auto=format&fit=crop&q=80"
      }
    ];
    
    // Add all players to storage
    [...westPlayers, ...eastPlayers].forEach(player => {
      this.createPlayer(player);
    });
  }
}

export const storage = new MemStorage();
