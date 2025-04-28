import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertMatchSchema, 
  insertSetSchema, 
  updateSetSchema, 
  insertGameLogSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all players
  app.get("/api/players", async (_req: Request, res: Response) => {
    const players = await storage.getAllPlayers(); // Assuming getAllPlayers is implemented in storage
    res.json(players);
  });


  // Get a specific player
  app.get("/api/player/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid player ID" });
    }

    const player = await storage.getPlayer(id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json(player);
  });

  // Create a new match
  app.post("/api/matches", async (req: Request, res: Response) => {
    try {
      const matchData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(matchData);

      // Create first set automatically
      const setData = {
        matchId: match.id,
        setNumber: 1
      };
      const set = await storage.createSet(setData);

      // Add initial log message
      await storage.createGameLog({
        matchId: match.id,
        setId: set.id,
        message: "Match started! First to 21 points wins."
      });

      res.status(201).json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid match data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create match" });
    }
  });

  // Get all matches
  app.get("/api/matches", async (_req: Request, res: Response) => {
    const matches = await storage.getMatches();
    res.json(matches);
  });

  // Get a specific match
  app.get("/api/matches/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid match ID" });
    }

    const match = await storage.getMatch(id);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.json(match);
  });

  // Update match (for completing or setting MVP)
  app.patch("/api/matches/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid match ID" });
    }

    try {
      const match = await storage.getMatch(id);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      const updateSchema = z.object({
        isComplete: z.boolean().optional(),
        winningDivision: z.string().optional(),
        mvpPlayerId: z.number().optional()
      });

      const updateData = updateSchema.parse(req.body);
      const updatedMatch = await storage.updateMatch(id, updateData);

      res.json(updatedMatch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid match data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update match" });
    }
  });

  // Get all sets for a match
  app.get("/api/matches/:matchId/sets", async (req: Request, res: Response) => {
    const matchId = parseInt(req.params.matchId);
    if (isNaN(matchId)) {
      return res.status(400).json({ message: "Invalid match ID" });
    }

    const sets = await storage.getSets(matchId);
    res.json(sets);
  });

  // Create a new set
  app.post("/api/sets", async (req: Request, res: Response) => {
    try {
      const setData = insertSetSchema.parse(req.body);
      const set = await storage.createSet(setData);

      // Add initial log message for new set
      await storage.createGameLog({
        matchId: set.matchId,
        setId: set.id,
        message: `Set ${set.setNumber} started!`
      });

      res.status(201).json(set);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid set data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create set" });
    }
  });

  // Update a set
  app.patch("/api/sets/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid set ID" });
    }

    try {
      const set = await storage.getSet(id);
      if (!set) {
        return res.status(404).json({ message: "Set not found" });
      }

      const updateData = updateSetSchema.parse(req.body);
      const updatedSet = await storage.updateSet(id, updateData);

      res.json(updatedSet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid set data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update set" });
    }
  });

  // Get all game logs for a match
  app.get("/api/matches/:matchId/logs", async (req: Request, res: Response) => {
    const matchId = parseInt(req.params.matchId);
    if (isNaN(matchId)) {
      return res.status(400).json({ message: "Invalid match ID" });
    }

    const logs = await storage.getGameLogs(matchId);
    res.json(logs);
  });

  // Create a new game log
  app.post("/api/logs", async (req: Request, res: Response) => {
    try {
      const logData = insertGameLogSchema.parse(req.body);
      const log = await storage.createGameLog(logData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid log data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create log" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}