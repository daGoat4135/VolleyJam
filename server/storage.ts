import { 
  players, type Player, type InsertPlayer,
  matches, type Match, type InsertMatch,
  sets, type Set, type InsertSet, type UpdateSet,
  gameLogs, type GameLog, type InsertGameLog,
  users, type User, type InsertUser 
} from "@shared/schema";

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
    const player: Player = { ...insertPlayer, id };
    this.players.set(id, player);
    return player;
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
        avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "AMBER",
        division: "west",
        team: "SEATTLE",
        speed: 6,
        power: 9,
        avatarUrl: "https://images.unsplash.com/photo-1508341591423-4347099e1f19?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "ANTHONY",
        division: "west",
        team: "SACRAMENTO",
        speed: 9,
        power: 6,
        avatarUrl: "https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "BILLY",
        division: "west",
        team: "SACRAMENTO",
        speed: 8,
        power: 7,
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "DANNY",
        division: "west",
        team: "GOLDEN STATE",
        speed: 8,
        power: 7,
        avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "HUGO",
        division: "west",
        team: "LA LAKERS",
        speed: 6,
        power: 10,
        avatarUrl: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150&h=150&auto=format&fit=crop&q=80"
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
        avatarUrl: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "KELLY",
        division: "east",
        team: "CHARLOTTE",
        speed: 7,
        power: 8,
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "KYLE",
        division: "east",
        team: "BOSTON",
        speed: 9,
        power: 6,
        avatarUrl: "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "MARK",
        division: "east",
        team: "CHICAGO",
        speed: 8,
        power: 8,
        avatarUrl: "https://images.unsplash.com/photo-1503235930437-8c6293ba41f5?w=150&h=150&auto=format&fit=crop&q=80"
      },
      {
        name: "SACHIN",
        division: "east",
        team: "DETROIT",
        speed: 10,
        power: 5,
        avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&auto=format&fit=crop&q=80"
      }
    ];
    
    // Add all players to storage
    [...westPlayers, ...eastPlayers].forEach(player => {
      this.createPlayer(player);
    });
  }
}

export const storage = new MemStorage();
