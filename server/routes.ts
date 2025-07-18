import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ratingEngine } from './ratingEngine';
import { z } from "zod";
import { 
  insertMatchSchema,
  insertGameLogSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all players
  app.get("/api/players", async (_req: Request, res: Response) => {
    const players = await storage.getPlayers(); // Get all players using the correct method
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

      // Create an initial set for the match
      const initialSet = await storage.createSet({
        matchId: match.id,
        setNumber: 1
      });

      // Add initial log message
      await storage.createGameLog({
        matchId: match.id,
        setId: initialSet.id,
        message: "Game started! First to 21 points wins."
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

  // Delete a specific match
  app.delete("/api/matches/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid match ID" });
    }

    try {
      await storage.deleteMatch(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete match" });
    }
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
        mvpPlayerId: z.number().optional(),
        westScore: z.number().optional(),
        eastScore: z.number().optional()
      });

      const updateData = updateSchema.parse(req.body);
      const updatedMatch = await storage.updateMatch(id, updateData);

      // If match is complete, update player ratings
      if (updateData.isComplete && updateData.winningDivision) {
        try {
          console.log('Starting player rating update for match:', id);
          
          // Fetch players
          const westPlayers = await Promise.all([
            storage.getPlayer(match.westPlayer1Id),
            storage.getPlayer(match.westPlayer2Id)
          ]);
          const eastPlayers = await Promise.all([
            storage.getPlayer(match.eastPlayer1Id),
            storage.getPlayer(match.eastPlayer2Id)
          ]);

          // Calculate score difference
          const westScore = updateData.westScore || 0;
          const eastScore = updateData.eastScore || 0;
          const scoreDiff = Math.abs(westScore - eastScore);
          
          console.log('Match scores:', { westScore, eastScore, scoreDiff });

          // Update ratings for all players
          const isWestWinner = updateData.winningDivision === 'west';
          const westResult = isWestWinner ? 1 : 0;
          const eastResult = isWestWinner ? 0 : 1;
          
          // Calculate team average ratings
          const getTeamAverage = (players: (Player | undefined)[]) => {
            const validPlayers = players.filter((p): p is Player => p !== null && p !== undefined);
            return {
              rating: validPlayers.reduce((sum, p) => sum + (p.rating || ratingEngine.getInitialRating().rating), 0) / validPlayers.length,
              ratingDeviation: validPlayers.reduce((sum, p) => sum + (p.ratingDeviation || ratingEngine.getInitialRating().ratingDeviation), 0) / validPlayers.length,
              volatility: "0.06" // Use default volatility for team average
            };
          };

          const eastTeamRating = getTeamAverage(eastPlayers);
          
          // Process west players using team average opponent rating
          for (const westPlayer of westPlayers) {
            if (westPlayer) {
              try {
                console.log(`Processing west player ${westPlayer.id} (${westPlayer.name})`);
                
                const newRating = ratingEngine.calculateNewRating(
                  {
                    rating: westPlayer.rating || ratingEngine.getInitialRating().rating,
                    ratingDeviation: westPlayer.ratingDeviation || ratingEngine.getInitialRating().ratingDeviation,
                    volatility: westPlayer.volatility || ratingEngine.getInitialRating().volatility.toString()
                  },
                  [eastTeamRating], // Just use team average rating once
                  [westResult],
                  [scoreDiff]
                );
                
                await storage.updatePlayer(westPlayer.id, newRating);
                console.log(`Updated west player ${westPlayer.id} rating to:`, newRating);
              } catch (playerError) {
                console.error(`Error updating west player ${westPlayer.id} rating:`, playerError);
                // Continue with other players even if one fails
              }
            }
          }

          // Calculate west team average rating
          const westTeamRating = getTeamAverage(westPlayers);
          
          // Process east players using team average opponent rating
          for (const eastPlayer of eastPlayers) {
            if (eastPlayer) {
              try {
                console.log(`Processing east player ${eastPlayer.id} (${eastPlayer.name})`);
                
                const newRating = ratingEngine.calculateNewRating(
                  {
                    rating: eastPlayer.rating || ratingEngine.getInitialRating().rating,
                    ratingDeviation: eastPlayer.ratingDeviation || ratingEngine.getInitialRating().ratingDeviation,
                    volatility: eastPlayer.volatility || ratingEngine.getInitialRating().volatility.toString()
                  },
                  [westTeamRating], // Just use team average rating once
                  [eastResult],
                  [scoreDiff]
                );
                
                await storage.updatePlayer(eastPlayer.id, newRating);
                console.log(`Updated east player ${eastPlayer.id} rating to:`, newRating);
              } catch (playerError) {
                console.error(`Error updating east player ${eastPlayer.id} rating:`, playerError);
                // Continue with other players even if one fails
              }
            }
          }
          
          console.log('Successfully completed player rating updates for match:', id);
        } catch (ratingError) {
          // Log the error but don't stop the response - the match is already updated
          console.error('Error updating player ratings:', ratingError);
        }
      }

      res.json(updatedMatch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid match data", errors: error.errors });
      }
      console.error("Error updating match:", error);
      res.status(500).json({ message: "Failed to update match", error: error instanceof Error ? error.message : String(error) });
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

  // Get rating settings
  app.get("/api/rating-settings", (_req: Request, res: Response) => {
    res.json(ratingEngine.getSettings());
  });

  // Update rating settings
  app.post("/api/rating-settings", async (req: Request, res: Response) => {
    try {
      const settingsSchema = z.object({
        dailyBonusAmount: z.number(),
        kFactor: z.number(),
        initialRating: z.number(),
        victoryMarginWeight: z.string()
      });

      const settings = settingsSchema.parse(req.body);
      ratingEngine.updateSettings(settings);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Track last MVP award date
  let lastMvpAwardDate: Date | null = null;

  // Calculate and award daily MVP
  app.post("/api/daily-mvp", async (_req: Request, res: Response) => {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if MVP was already awarded today
    if (lastMvpAwardDate && lastMvpAwardDate.getTime() === today.getTime()) {
      return res.status(400).json({
        success: false,
        message: "MVP has already been awarded today"
      });
    }

    const matches = await storage.getMatches();
    const todayMatches = matches.filter(m => {
      const matchDate = new Date(m.createdAt);
      matchDate.setHours(0, 0, 0, 0);
      return matchDate.getTime() === today.getTime() && m.isComplete;
    });

    // Calculate points per player
    const playerPoints: Record<number, number> = {};

    // For each match, add the points to each player
    for (const match of todayMatches) {
      const sets = await storage.getSets(match.id);
      
      // Get total points scored in this match
      const westScore = sets.reduce((sum, set) => sum + (set.westScore || 0), 0);
      const eastScore = sets.reduce((sum, set) => sum + (set.eastScore || 0), 0);

      // Initialize points for players if not already set
      if (match.westPlayer1Id && !playerPoints[match.westPlayer1Id]) playerPoints[match.westPlayer1Id] = 0;
      if (match.westPlayer2Id && !playerPoints[match.westPlayer2Id]) playerPoints[match.westPlayer2Id] = 0;
      if (match.eastPlayer1Id && !playerPoints[match.eastPlayer1Id]) playerPoints[match.eastPlayer1Id] = 0;
      if (match.eastPlayer2Id && !playerPoints[match.eastPlayer2Id]) playerPoints[match.eastPlayer2Id] = 0;

      // Add west team points cumulatively
      if (match.westPlayer1Id) {
        playerPoints[match.westPlayer1Id] += Math.floor(westScore);
      }
      if (match.westPlayer2Id) {
        playerPoints[match.westPlayer2Id] += Math.floor(westScore);
      }

      // Add east team points cumulatively
      if (match.eastPlayer1Id) {
        playerPoints[match.eastPlayer1Id] += Math.floor(eastScore);
      }
      if (match.eastPlayer2Id) {
        playerPoints[match.eastPlayer2Id] += Math.floor(eastScore);
      }

      console.log('Match points:', {
        matchId: match.id,
        westScore,
        eastScore,
        players: {...playerPoints} // Spread to get a clean log
      });
    }

    // Find highest score and show point totals
    const scores = Object.values(playerPoints);
    const maxScore = Math.max(...scores);
    
    // Find all players with points and log their totals
    const playerTotals = Object.entries(playerPoints)
      .map(([playerId, score]) => ({
        playerId: parseInt(playerId),
        score
      }))
      .sort((a, b) => b.score - a.score);

    // Log point totals for debugging
    console.log('Player point totals:', playerTotals);
    
    // Find winner(s) with highest score
    const winners = playerTotals.filter(player => player.score === maxScore);

    if (todayMatches.length === 0) {
      return res.json({
        success: false,
        message: "No eligible matches"
      });
    }

    if (winners.length === 1) {
      const [winner] = winners;
      const winnerId = winner.playerId;
      const settings = ratingEngine.getSettings();
      const player = await storage.getPlayer(winnerId);

      if (player) {
        const newRating = (player.rating || settings.initialRating) + settings.dailyBonusAmount;
        await storage.updatePlayer(player.id, {
          rating: newRating,
          ratingDeviation: player.ratingDeviation || ratingEngine.getInitialRating().ratingDeviation,
          volatility: player.volatility || ratingEngine.getInitialRating().volatility.toString()
        });

        // Track the award date
        lastMvpAwardDate = today;

        return res.json({ 
          success: true, 
          mvp: player,
          points: maxScore,
          ratingBonus: settings.dailyBonusAmount 
        });
      }
    }

    // If we get here, we either have multiple winners or couldn't find the player
    res.json({ 
      success: false, 
      message: "Tied for MVP",
      tiedPlayers: winners.map(w => w.playerId),
      points: maxScore
    });
  });

  // Export ratings as CSV
  app.get("/api/export-ratings", async (_req: Request, res: Response) => {
    const players = await storage.getPlayers();
    const csv = players.map(p => `${p.name},${p.rating},${p.ratingDeviation},${p.volatility}`).join('\n');
    const headers = 'Name,Rating,RD,Volatility\n';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=ratings.csv');
    res.send(headers + csv);
  });

  // Clear database endpoint
  app.post("/api/clear-database", async (_req: Request, res: Response) => {
    try {
      await storage.clearDatabase();
      res.json({ message: "Database cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear database" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}