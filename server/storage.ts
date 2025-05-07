import { 
  players, type Player, type InsertPlayer,
  matches, type Match, type InsertMatch,
  sets, type Set, type InsertSet, type UpdateSet,
  gameLogs, type GameLog, type InsertGameLog,
  users, type User, type InsertUser 
} from "@shared/schema";
import { eq } from "drizzle-orm";
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

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export class PostgresStorage implements IStorage {
  private pool: Pool;
  private db: ReturnType<typeof drizzle>;

  async clearDatabase(): Promise<void> {
    await this.db.delete(matches);
    await this.db.delete(gameLogs);
    await this.db.delete(sets);
    
    // Reset player ratings but keep the players
    const players = await this.getPlayers();
    for (const player of players) {
      await this.updatePlayer(player.id, {
        rating: ratingEngine.getInitialRating().rating,
        ratingDeviation: ratingEngine.getInitialRating().ratingDeviation,
        volatility: ratingEngine.getInitialRating().volatility.toString()
      });
    }
  }

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10
    });
    
    this.db = drizzle(this.pool);
    
    // Initialize players if needed
    this.initializePlayersIfNeeded();
  }

  private async initializePlayersIfNeeded() {
    const existingPlayers = await this.getPlayers();
    if (existingPlayers.length === 0) {
      await this.initializePlayers();
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Players
  async getPlayers(): Promise<Player[]> {
    return this.db.select().from(players);
  }
  
  async getPlayersByDivision(division: string): Promise<Player[]> {
    return this.db.select().from(players).where(eq(players.division, division));
  }
  
  async getPlayer(id: number): Promise<Player | undefined> {
    const [player] = await this.db.select().from(players).where(eq(players.id, id));
    return player;
  }
  
  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await this.db.insert(players)
      .values({
        ...insertPlayer,
        rating: ratingEngine.getInitialRating().rating,
        ratingDeviation: ratingEngine.getInitialRating().ratingDeviation,
        volatility: String(ratingEngine.getInitialRating().volatility), // Convert to string
        dailyPoints: 0
      })
      .returning();
    return player;
  }

  async updatePlayer(id: number, ratingData: { rating: number; ratingDeviation: number; volatility: number | string }): Promise<Player> {
    const [updatedPlayer] = await this.db
      .update(players)
      .set({
        rating: ratingData.rating,
        ratingDeviation: ratingData.ratingDeviation,
        volatility: typeof ratingData.volatility === 'number' ? String(ratingData.volatility) : ratingData.volatility
      })
      .where(eq(players.id, id))
      .returning();
      
    if (!updatedPlayer) {
      throw new Error(`Player with id ${id} not found`);
    }
    
    return updatedPlayer;
  }
  
  // Matches
  async getMatches(): Promise<Match[]> {
    return this.db.select().from(matches);
  }
  
  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await this.db.select().from(matches).where(eq(matches.id, id));
    return match;
  }
  
  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await this.db.insert(matches)
      .values({
        ...insertMatch,
        isComplete: false,
        westScore: 0,
        eastScore: 0
      })
      .returning();
    return match;
  }
  
  async updateMatch(id: number, data: Partial<Match>): Promise<Match> {
    const [updatedMatch] = await this.db
      .update(matches)
      .set(data)
      .where(eq(matches.id, id))
      .returning();
      
    if (!updatedMatch) {
      throw new Error(`Match with id ${id} not found`);
    }
    
    return updatedMatch;
  }
  
  // Sets
  async getSets(matchId: number): Promise<Set[]> {
    return this.db
      .select()
      .from(sets)
      .where(eq(sets.matchId, matchId))
      .orderBy(sets.setNumber);
  }
  
  async getSet(id: number): Promise<Set | undefined> {
    const [set] = await this.db.select().from(sets).where(eq(sets.id, id));
    return set;
  }
  
  async createSet(insertSet: InsertSet): Promise<Set> {
    const [set] = await this.db
      .insert(sets)
      .values({
        ...insertSet,
        westScore: 0,
        eastScore: 0,
        isComplete: false,
        winningDivision: null
      })
      .returning();
    return set;
  }
  
  async updateSet(id: number, data: UpdateSet): Promise<Set> {
    const [updatedSet] = await this.db
      .update(sets)
      .set(data)
      .where(eq(sets.id, id))
      .returning();
      
    if (!updatedSet) {
      throw new Error(`Set with id ${id} not found`);
    }
    
    return updatedSet;
  }
  
  // Game Logs
  async getGameLogs(matchId: number): Promise<GameLog[]> {
    return this.db
      .select()
      .from(gameLogs)
      .where(eq(gameLogs.matchId, matchId))
      .orderBy(gameLogs.timestamp);
  }
  
  async createGameLog(insertGameLog: InsertGameLog): Promise<GameLog> {
    const [gameLog] = await this.db
      .insert(gameLogs)
      .values(insertGameLog)
      .returning();
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

export const storage = new PostgresStorage();
