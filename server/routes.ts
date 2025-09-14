import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { gameEngine } from "./game-engine";
import { pvpEngine } from "./pvp-engine";
import { KyuukeiBot } from "./discord-bot";

let discordBot: KyuukeiBot | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Start Discord bot
  try {
    discordBot = new KyuukeiBot();
    await discordBot.start();
  } catch (error) {
    console.error('Failed to start Discord bot:', error);
  }

  // API Routes
  app.get("/api/health", async (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // User routes
  app.get("/api/users/:discordId", async (req, res) => {
    try {
      const user = await storage.getUserByDiscordId(req.params.discordId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Character routes
  app.get("/api/characters/base", async (_req, res) => {
    try {
      const characters = await storage.getBaseCharacters();
      res.json(characters);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/characters", async (req, res) => {
    try {
      const { status } = req.query;
      const characters = await storage.getUserCharacters(
        req.params.userId,
        status as string
      );
      res.json(characters);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Training routes
  app.get("/api/users/:userId/training", async (req, res) => {
    try {
      const session = await storage.getTrainingSession(req.params.userId);
      if (!session) {
        return res.status(404).json({ message: "No active training session" });
      }
      
      // Get character and options
      const character = await storage.getCharacterInstance(session.characterInstanceId);
      const contentBlocks = await storage.getContentBlocks();
      const options = session.currentOptions?.map(id => 
        contentBlocks.find(block => block.id === id)
      ).filter(Boolean) || [];

      res.json({
        session,
        character,
        options
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PvP routes
  app.get("/api/users/:userId/pvp-matches", async (req, res) => {
    try {
      const matches = await storage.getUserPvpMatches(req.params.userId, 10);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Items routes
  app.get("/api/items", async (_req, res) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Character of the Day
  app.get("/api/cotd", async (_req, res) => {
    try {
      const { getDailyFeaturedCharacter } = await import('./discord-bot');
      const cotdCharacterId = await getDailyFeaturedCharacter();
      const cotdChar = await storage.getBaseCharacter(cotdCharacterId);
      const today = new Date().toISOString().split('T')[0];
      res.json({ character: cotdChar, date: today });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Game engine test routes (for development)
  app.post("/api/test/roll", async (req, res) => {
    try {
      const { userId, count = 5 } = req.body;
      console.log(`🎲 Generating roll for user ${userId}, count: ${count}`);
      
      // Create test user if it doesn't exist
      let user = await storage.getUser(userId);
      if (!user) {
        console.log(`👤 Creating test user ${userId}`);
        user = await storage.createUser({
          discordId: userId,
          username: `TestUser_${userId}`,
        });
      }
      
      const candidates = await gameEngine.generateRollCandidates(user.id, count);
      console.log(`✅ Generated ${candidates.length} candidates`);
      res.json(candidates);
    } catch (error) {
      console.error("❌ Error generating roll:", error);
      res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/test/pvp", async (req, res) => {
    try {
      const { challengerId, opponentId, challengerCharId, opponentCharId } = req.body;
      const result = await pvpEngine.simulateBattle(
        challengerId,
        opponentId, 
        challengerCharId,
        opponentCharId
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  app.post("/api/admin/cotd", async (req, res) => {
    try {
      const { date, characterId } = req.body;
      await storage.setCharacterOfTheDay(date, characterId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Debug endpoint to test COTD functionality
  app.get("/api/debug/cotd-featured", async (req, res) => {
    try {
      const { getDailyFeaturedCharacter } = await import('./discord-bot');
      const featuredCharacter = await getDailyFeaturedCharacter();
      res.json({
        featuredCharacter,
        source: "cotd.json",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get featured character',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  // Cleanup on server shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down Discord bot...');
    if (discordBot) {
      await discordBot.stop();
    }
  });

  return httpServer;
}
