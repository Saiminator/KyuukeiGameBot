import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SelectMenuBuilder, ComponentType, Colors } from 'discord.js';
import { storage } from './storage';
import { gameEngine } from './game-engine';
import { pvpEngine } from './pvp-engine';
import { type CharacterInstance, type User, type CharacterStats } from '@shared/schema';

// Character of the day functionality - reads from cotd.json file
async function getDailyFeaturedCharacter(): Promise<string> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const cotdPath = path.resolve('cotd.json');
    const cotdData = await fs.readFile(cotdPath, 'utf-8');
    const { character } = JSON.parse(cotdData);
    console.log(`📅 Daily featured character: ${character} (from cotd.json)`);
    return character;
  } catch (error) {
    console.error('Failed to read COTD file, defaulting to kyuu:', error);
    return 'kyuu';
  }
}

// Get character profile picture URL
function getCharacterImageUrl(characterId: string): string {
  return `https://kyuukei.s3.us-east-2.amazonaws.com/character/${characterId.toLowerCase()}/pfp.png`;
}

// Export the function for testing
export { getDailyFeaturedCharacter };

export class KyuukeiBot {
  private client: Client;
  private token: string;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ]
    });

    this.token = process.env.DISCORD_BOT_TOKEN || '';
    if (!this.token) {
      throw new Error('DISCORD_BOT_TOKEN environment variable is required');
    }

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('ready', () => {
      console.log(`✅ ${this.client.user?.tag} is online!`);
      this.setupSlashCommands();
    });

    this.client.on('interactionCreate', async (interaction) => {
      try {
        if (interaction.isCommand()) {
          await this.handleCommand(interaction);
        } else if (interaction.isButton()) {
          await this.handleButton(interaction);
        } else if (interaction.isSelectMenu()) {
          await this.handleSelectMenu(interaction);
        }
      } catch (error) {
        console.error('Error handling interaction:', error);
        
        if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ An error occurred while processing your request.',
            ephemeral: true
          });
        }
      }
    });
  }

  private async setupSlashCommands() {
    const commands = [
      {
        name: 'roll',
        description: 'Roll for new character candidates (once per hour)'
      },
      {
        name: 'collection',
        description: 'View your character collection'
      },
      {
        name: 'pvp',
        description: 'Challenge another player to PvP',
        options: [{
          name: 'opponent',
          type: 6, // USER type
          description: 'Player to challenge',
          required: true
        }]
      },
      {
        name: 'resume',
        description: 'Resume ongoing training session'
      },
      {
        name: 'cotd',
        description: 'Check Character of the Day'
      }
    ];

    await this.client.application?.commands.set(commands);
  }

  private async handleCommand(interaction: any) {
    const { commandName, user } = interaction;

    // Get or create user
    let gameUser = await storage.getUserByDiscordId(user.id);
    if (!gameUser) {
      gameUser = await storage.createUser({
        discordId: user.id,
        username: user.username
      });
    }

    switch (commandName) {
      case 'roll':
        await this.handleRollCommand(interaction, gameUser);
        break;
      case 'collection':
        await this.handleCollectionCommand(interaction, gameUser);
        break;
      case 'pvp':
        await this.handlePvPCommand(interaction, gameUser);
        break;
      case 'resume':
        await this.handleResumeCommand(interaction, gameUser);
        break;
      case 'cotd':
        await this.handleCOTDCommand(interaction);
        break;
    }
  }

  private async handleRollCommand(interaction: any, user: User) {
    // Time limit removed for testing
    // if (!gameEngine.canUserRoll(user)) {
    //   const lastRoll = user.lastRoll!;
    //   const nextRoll = new Date(lastRoll.getTime() + 60 * 60 * 1000);
    //   const timeRemaining = Math.ceil((nextRoll.getTime() - Date.now()) / 60000);
    //   
    //   await interaction.reply({
    //     content: `⏰ You can roll again in ${timeRemaining} minutes.`,
    //     ephemeral: true
    //   });
    //   return;
    // }

    // Clear any existing candidates
    const existingCandidates = await storage.getUserCharacters(user.id, 'candidate');
    for (const candidate of existingCandidates) {
      await storage.updateCharacterInstance(candidate.id, { status: 'discarded' });
    }

    // Generate new candidates
    const candidates = await gameEngine.generateRollCandidates(user.id, 5);
    
    // Sort candidates by percentage (best first)
    candidates.sort((a, b) => b.averagePercentage - a.averagePercentage);
    
    // Update user's last roll time
    await storage.updateUser(user.id, { lastRoll: new Date() });

    // Get character of the day - check storage first, then use daily rotation
    const today = new Date().toISOString().split('T')[0];
    let cotdCharacterId = await storage.getCharacterOfTheDay(today);
    
    // If no COTD for today, use daily featured character
    if (!cotdCharacterId) {
      cotdCharacterId = await getDailyFeaturedCharacter();
      await storage.setCharacterOfTheDay(today, cotdCharacterId);
    }
    
    // Create main embed with COTD info
    const mainEmbed = new EmbedBuilder()
      .setTitle('🎲 Hourly Character Roll')
      .setDescription('Choose one character to start training, or trash all candidates.')
      .setColor(Colors.Blue);

    if (cotdCharacterId) {
      const cotdChar = await storage.getBaseCharacter(cotdCharacterId);
      mainEmbed.addFields({
        name: '⭐ Character of the Day',
        value: `**${cotdChar?.name}** - +10pp bonus to all stats (capped at 115%)`,
        inline: false
      });
    }

    // Create separate embeds for each character with their picture
    const characterEmbeds = [];
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const baseChar = await storage.getBaseCharacter(candidate.baseCharacterId);
      const tierEmoji = this.getTierEmoji(candidate.tier);
      const cotdTag = candidate.cotdUsed ? ' 🌟' : '';
      const percentages = candidate.rollPercentages;
      
      const characterImageUrl = getCharacterImageUrl(candidate.baseCharacterId);
      
      // Format stats in a cleaner way
      const statsLine1 = `**STR:** ${percentages.str}% **AGI:** ${percentages.agi}% **STA:** ${percentages.sta}% **MAG:** ${percentages.mag}%`;
      const statsLine2 = `**WIT:** ${percentages.wit}% **WIL:** ${percentages.wil}% **CHA:** ${percentages.cha}% **LUK:** ${percentages.luk}%`;
      
      const characterEmbed = new EmbedBuilder()
        .setTitle(`${i + 1}. ${baseChar?.name} ${tierEmoji} (${candidate.averagePercentage}%)${cotdTag}`)
        .setDescription(`${statsLine1}\n${statsLine2}`)
        .setThumbnail(characterImageUrl)
        .setColor(this.getTierColor(candidate.tier));
      
      characterEmbeds.push(characterEmbed);
    }
    
    const allEmbeds = [mainEmbed, ...characterEmbeds];

    // Create buttons for each candidate (up to 5)
    const actionRows = [];
    const buttons: ButtonBuilder[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const baseChar = await storage.getBaseCharacter(candidate.baseCharacterId);
      const button = new ButtonBuilder()
        .setCustomId(`select_candidate:${candidate.id}`)
        .setLabel(`${i + 1}. ${baseChar?.name} (${candidate.tier})`)
        .setStyle(ButtonStyle.Primary);
      buttons.push(button);
    }

    // Distribute buttons more evenly: 5 buttons per row
    for (let i = 0; i < buttons.length; i += 5) {
      const rowButtons = buttons.slice(i, i + 5);
      actionRows.push(new ActionRowBuilder().addComponents(rowButtons));
    }

    // Add trash button
    const trashButton = new ButtonBuilder()
      .setCustomId('trash_all_candidates')
      .setLabel('🗑️ Trash All')
      .setStyle(ButtonStyle.Danger);

    actionRows.push(new ActionRowBuilder().addComponents(trashButton));

    await interaction.reply({
      embeds: allEmbeds,
      components: actionRows,
      ephemeral: false
    });
  }

  private async handleButton(interaction: any) {
    const [action, ...params] = interaction.customId.split(':');
    const userId = interaction.user.id;

    // Verify user ownership
    let gameUser = await storage.getUserByDiscordId(userId);
    if (!gameUser) {
      await interaction.reply({
        content: '❌ User not found. Please use `/roll` first.',
        ephemeral: true
      });
      return;
    }

    switch (action) {
      case 'select_candidate':
        await this.handleSelectCandidate(interaction, gameUser, params[0]);
        break;
      case 'trash_all_candidates':
        await this.handleTrashCandidates(interaction, gameUser);
        break;
      case 'training_choice':
        await this.handleTrainingChoice(interaction, gameUser, params.join(':'));
        break;
      case 'continue_training':
        await this.handleContinueTraining(interaction, gameUser);
        break;
      case 'set_active_pvp':
        await this.handleSetActivePvP(interaction, gameUser, params[0]);
        break;
      case 'accept_pvp':
        await this.handleAcceptPvP(interaction, gameUser, params[0]);
        break;
      case 'decline_pvp':
        await this.handleDeclinePvP(interaction, gameUser, params[0]);
        break;
      case 'open_shop':
        await this.handleShop(interaction, gameUser, params[0]);
        break;
    }
  }

  private async handleSelectCandidate(interaction: any, user: User, candidateId: string) {
    const candidate = await storage.getCharacterInstance(candidateId);
    if (!candidate || candidate.userId !== user.id || candidate.status !== 'candidate') {
      await interaction.reply({
        content: '❌ Invalid candidate selection.',
        ephemeral: true
      });
      return;
    }

    // Start training session
    try {
      const { session, options } = await gameEngine.startTraining(candidateId);
      
      const embed = new EmbedBuilder()
        .setTitle('🏋️ Training Started!')
        .setDescription('Your training session will continue in DMs.')
        .setColor(Colors.Green);

      await interaction.update({
        embeds: [embed],
        components: []
      });

      // Send DM with training options - fetch updated character
      const updatedCharacter = await storage.getCharacterInstance(candidateId);
      await this.sendTrainingOptions(interaction.user, updatedCharacter!, session, options);
      
    } catch (error) {
      await interaction.reply({
        content: '❌ Failed to start training session.',
        ephemeral: true
      });
    }
  }

  private async sendTrainingOptions(discordUser: any, character: CharacterInstance, session: any, options: any[], isDM: boolean = false) {
    const baseChar = await storage.getBaseCharacter(character.baseCharacterId);
    
    const embed = new EmbedBuilder()
      .setTitle(`🏋️ Training Session - Day ${character.trainingDay}/${character.maxTrainingDays}`)
      .setDescription(`Training with **${baseChar?.name}** ${this.getTierEmoji(character.tier)}`)
      .setColor(Colors.Blue);

    // Character status
    embed.addFields({
      name: '📊 Character Status',
      value: this.formatCharacterStats(character),
      inline: false
    });

    // Add training options
    let optionsText = '';
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const isEvent = option.kind === 'event';
      const eventTag = isEvent ? '⚡ **Special Event** - ' : '';
      
      optionsText += `**${i + 1}.** ${option.label}\n`;
      if (option.preFlair && isEvent) {
        optionsText += `*${option.preFlair}*\n`;
      }
      optionsText += `${eventTag}${this.formatStatGains(option.statGains)}\n\n`;
    }

    embed.addFields({
      name: '🎯 Training Options',
      value: optionsText,
      inline: false
    });

    // Create buttons
    const buttons = options.map((option, index) => {
      return new ButtonBuilder()
        .setCustomId(`training_choice:${session.id}:${option.id}`)
        .setLabel(`${index + 1}. ${option.label}`)
        .setStyle(option.kind === 'event' ? ButtonStyle.Secondary : ButtonStyle.Primary);
    });

    const actionRow = new ActionRowBuilder().addComponents(buttons);

    try {
      // Disable old training message if it exists
      if (session.lastMessageId) {
        try {
          const dm = await discordUser.createDM();
          const oldMessage = await dm.messages.fetch(session.lastMessageId);
          if (oldMessage) {
            await oldMessage.edit({
              components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId('disabled')
                  .setLabel('Options Expired')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true)
              )]
            });
          }
        } catch (error) {
          console.log('Could not disable old message:', error instanceof Error ? error.message : String(error));
        }
      }

      // Send new training message
      const message = await discordUser.send({
        embeds: [embed],
        components: [actionRow]
      });

      // Save new message ID and options to session
      await storage.updateTrainingSession(session.id, {
        lastMessageId: message.id,
        currentOptions: options.map(opt => opt.id),
        isWaitingForChoice: true
      });
    } catch (error) {
      console.error('Failed to send DM:', error);
      // Could send a message in the channel instead
    }
  }

  private async handleTrainingChoice(interaction: any, user: User, params: string) {
    const [sessionId, blockId] = params.split(':');
    
    const session = await storage.getTrainingSession(user.id);
    if (!session || session.id !== sessionId) {
      await interaction.reply({
        content: '❌ Training session not found.',
        ephemeral: true
      });
      return;
    }

    try {
      const result = await gameEngine.applyTrainingChoice(user.id, blockId);
      
      // Create result embed
      const embed = new EmbedBuilder()
        .setTitle('✅ Training Complete!')
        .setDescription(result.result.postFlair || 'Training session completed.')
        .setColor(Colors.Green);

      if (result.result.statGains) {
        embed.addFields({
          name: '📈 Stat Gains',
          value: this.formatStatGains(result.result.statGains),
          inline: true
        });
      }

      if (result.result.coinGain && result.result.coinGain > 0) {
        embed.addFields({
          name: '💰 Coins Earned',
          value: `+${result.result.coinGain} coins`,
          inline: true
        });
      }

      if (result.result.newItems && result.result.newItems.length > 0) {
        embed.addFields({
          name: '🎁 Items Obtained',
          value: result.result.newItems.join(', '),
          inline: false
        });
      }

      embed.addFields({
        name: '📊 Updated Stats',
        value: this.formatCharacterStats(result.character),
        inline: false
      });

      const components = [];

      if (result.result.openShop) {
        const shopButton = new ButtonBuilder()
          .setCustomId(`open_shop:${result.character.id}`)
          .setLabel('🏪 Visit Shop')
          .setStyle(ButtonStyle.Secondary);
        components.push(new ActionRowBuilder().addComponents(shopButton));
      }

      if (result.session) {
        // Training continues
        const continueButton = new ButtonBuilder()
          .setCustomId(`continue_training:${result.session.id}`)
          .setLabel('➡️ Continue Training')
          .setStyle(ButtonStyle.Primary);
        components.push(new ActionRowBuilder().addComponents(continueButton));
      } else {
        // Training completed - character locked
        embed.setTitle('🎉 Training Complete - Character Locked!');
        embed.setDescription('Your character has been added to your collection and is ready for PvP!');
        embed.setColor(Colors.Gold);
      }

      await interaction.update({
        embeds: [embed],
        components
      });

    } catch (error) {
      await interaction.reply({
        content: '❌ Failed to apply training choice.',
        ephemeral: true
      });
    }
  }

  private async handleCollectionCommand(interaction: any, user: User) {
    const characters = await storage.getUserCharacters(user.id, 'locked');
    const activePvPChar = await storage.getUserActivePvPCharacter(user.id);

    const embed = new EmbedBuilder()
      .setTitle('📚 Character Collection')
      .setDescription(`Locked Characters: ${characters.length}`)
      .setColor(Colors.Purple);

    if (activePvPChar) {
      const baseChar = await storage.getBaseCharacter(activePvPChar.baseCharacterId);
      embed.addFields({
        name: '⚔️ Active PvP Character',
        value: `${baseChar?.name} ${this.getTierEmoji(activePvPChar.tier)}`,
        inline: false
      });
    }

    if (characters.length === 0) {
      embed.addFields({
        name: 'No Characters',
        value: 'Use `/roll` to get your first character!',
        inline: false
      });

      await interaction.reply({ embeds: [embed], ephemeral: false });
      return;
    }

    // Show first 5 characters with buttons to set as active
    const displayChars = characters.slice(0, 5);
    let characterList = '';
    
    for (const char of displayChars) {
      const baseChar = await storage.getBaseCharacter(char.baseCharacterId);
      const isActive = char.isActivePvP ? ' 🟢' : '';
      characterList += `**${baseChar?.name}** ${this.getTierEmoji(char.tier)}${isActive}\n`;
      characterList += `Stats: ${this.formatCharacterStatsInline(char.currentStats)}\n`;
      characterList += `Items: ${char.items && char.items.length > 0 ? char.items.join(', ') : 'None'}\n\n`;
    }

    embed.addFields({
      name: 'Your Characters',
      value: characterList,
      inline: false
    });

    // Create buttons to set active PvP character
    const buttons = displayChars
      .filter(char => !char.isActivePvP)
      .slice(0, 3)
      .map((char, index) => {
        return new ButtonBuilder()
          .setCustomId(`set_active_pvp:${char.id}`)
          .setLabel(`Set ${char.baseCharacterId} as Active`)
          .setStyle(ButtonStyle.Primary);
      });

    const components = [];
    if (buttons.length > 0) {
      components.push(new ActionRowBuilder().addComponents(buttons));
    }

    await interaction.reply({
      embeds: [embed],
      components,
      ephemeral: false
    });
  }

  private async handlePvPCommand(interaction: any, user: User) {
    const opponent = interaction.options.getUser('opponent');
    
    if (opponent.id === user.discordId) {
      await interaction.reply({
        content: '❌ You cannot challenge yourself!',
        ephemeral: true
      });
      return;
    }

    const opponentUser = await storage.getUserByDiscordId(opponent.id);
    if (!opponentUser) {
      await interaction.reply({
        content: '❌ Opponent has not played the game yet.',
        ephemeral: true
      });
      return;
    }

    const challengerChar = await storage.getUserActivePvPCharacter(user.id);
    const opponentChar = await storage.getUserActivePvPCharacter(opponentUser.id);

    if (!challengerChar) {
      await interaction.reply({
        content: '❌ You need to set an active PvP character first. Use `/collection` to select one.',
        ephemeral: true
      });
      return;
    }

    if (!opponentChar) {
      await interaction.reply({
        content: '❌ Your opponent has not set an active PvP character yet.',
        ephemeral: true
      });
      return;
    }

    // Create challenge embed
    const challengerBase = await storage.getBaseCharacter(challengerChar.baseCharacterId);
    const opponentBase = await storage.getBaseCharacter(opponentChar.baseCharacterId);

    const embed = new EmbedBuilder()
      .setTitle('⚔️ PvP Challenge!')
      .setDescription(`${interaction.user.username} challenges ${opponent.username} to battle!`)
      .setColor(Colors.Red);

    embed.addFields(
      {
        name: `${interaction.user.username}'s ${challengerBase?.name}`,
        value: `${this.getTierEmoji(challengerChar.tier)} ${this.formatCharacterStatsInline(challengerChar.currentStats)}`,
        inline: true
      },
      {
        name: `${opponent.username}'s ${opponentBase?.name}`,
        value: `${this.getTierEmoji(opponentChar.tier)} ${this.formatCharacterStatsInline(opponentChar.currentStats)}`,
        inline: true
      }
    );

    const acceptButton = new ButtonBuilder()
      .setCustomId(`accept_pvp:${user.id}:${challengerChar.id}:${opponentChar.id}`)
      .setLabel('⚔️ Accept Challenge')
      .setStyle(ButtonStyle.Success);

    const declineButton = new ButtonBuilder()
      .setCustomId(`decline_pvp:${user.id}`)
      .setLabel('❌ Decline')
      .setStyle(ButtonStyle.Danger);

    const actionRow = new ActionRowBuilder().addComponents(acceptButton, declineButton);

    await interaction.reply({
      content: `<@${opponent.id}>`,
      embeds: [embed],
      components: [actionRow],
      ephemeral: false
    });
  }

  private async handleAcceptPvP(interaction: any, acceptingUser: User, params: string) {
    const [challengerId, challengerCharId, opponentCharId] = params.split(':');
    
    // Verify the accepting user is the opponent
    if (acceptingUser.discordId !== interaction.user.id) {
      await interaction.reply({
        content: '❌ Only the challenged player can accept this battle.',
        ephemeral: true
      });
      return;
    }

    try {
      // Run PvP simulation
      const battleResult = await pvpEngine.simulateBattle(
        challengerId,
        acceptingUser.id,
        challengerCharId,
        opponentCharId
      );

      const embed = new EmbedBuilder()
        .setTitle('⚔️ PvP Battle Results')
        .setDescription(battleResult.narration)
        .setColor(Colors.Gold);

      const challengerBase = await storage.getBaseCharacter(battleResult.challenger.baseCharacterId);
      const opponentBase = await storage.getBaseCharacter(battleResult.opponent.baseCharacterId);

      if (battleResult.winner) {
        const winnerName = battleResult.winner === challengerId ? 
          `${challengerBase?.name}` : `${opponentBase?.name}`;
        embed.addFields({
          name: '👑 Victory',
          value: `**${winnerName}** emerges victorious!`,
          inline: false
        });
      } else {
        embed.addFields({
          name: '🤝 Draw',
          value: 'The battle ends in a draw!',
          inline: false
        });
      }

      await interaction.update({
        embeds: [embed],
        components: []
      });

    } catch (error) {
      await interaction.reply({
        content: '❌ Failed to simulate PvP battle.',
        ephemeral: true
      });
    }
  }

  private async handleShop(interaction: any, user: User, characterId: string) {
    const character = await storage.getCharacterInstance(characterId);
    if (!character || character.userId !== user.id) {
      await interaction.reply({
        content: '❌ Character not found or not owned by you.',
        ephemeral: true
      });
      return;
    }

    const items = await storage.getItems();
    const availableItems = items.filter(item => 
      item.shopOnly && 
      (!item.characterRestriction || item.characterRestriction === character.baseCharacterId)
    ).slice(0, 5); // Show up to 5 items

    if (availableItems.length === 0) {
      await interaction.reply({
        content: '🏪 The shop is empty right now. Check back later!',
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🏪 Spirit Merchant Shop')
      .setDescription(`Available items for purchase:\n💰 Your coins: ${character.coins || 0}`)
      .setColor(Colors.Purple);

    let itemList = '';
    for (const item of availableItems) {
      itemList += `**${item.name}** - ${item.price} coins\n${item.description}\n\n`;
    }

    embed.addFields({
      name: 'Available Items',
      value: itemList,
      inline: false
    });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }

  // Utility methods
  private getTierEmoji(tier: string): string {
    switch (tier) {
      case 'S': return '🌟';
      case 'A': return '🟢';
      case 'B': return '🟡';
      case 'C': return '🟠';
      case 'D': return '🔴';
      default: return '⚪';
    }
  }

  private getTierColor(tier: string): number {
    switch (tier) {
      case 'S': return 0xFFD700; // Gold
      case 'A': return 0x00FF00; // Green
      case 'B': return 0xFFFF00; // Yellow
      case 'C': return 0xFF8C00; // Orange
      case 'D': return 0xFF0000; // Red
      default: return 0x808080; // Gray
    }
  }

  private formatCharacterStats(character: CharacterInstance): string {
    const stats = character.currentStats;
    return `STR: ${stats.str} | AGI: ${stats.agi} | STA: ${stats.sta} | MAG: ${stats.mag}\nWIT: ${stats.wit} | WIL: ${stats.wil} | CHA: ${stats.cha} | LUK: ${stats.luk}`;
  }

  private formatCharacterStatsInline(stats: CharacterStats): string {
    return `STR:${stats.str} AGI:${stats.agi} STA:${stats.sta} MAG:${stats.mag} WIT:${stats.wit} WIL:${stats.wil} CHA:${stats.cha} LUK:${stats.luk}`;
  }

  private formatStatGains(gains: any): string {
    if (!gains) return 'No stat changes';
    
    const formatted = Object.entries(gains)
      .filter(([_, value]) => value && value !== 0)
      .map(([stat, value]) => `${stat.toUpperCase()}: +${value}`)
      .join(', ');
    
    return formatted || 'No stat changes';
  }

  // Missing handler methods
  private async handleSelectMenu(interaction: any) {
    // Handle select menu interactions if needed
    await interaction.reply({
      content: '❌ Select menu interactions not implemented yet.',
      ephemeral: true
    });
  }

  private async handleResumeCommand(interaction: any, user: User) {
    const session = await storage.getTrainingSession(user.id);
    if (!session) {
      await interaction.reply({
        content: '❌ No active training session found.',
        ephemeral: true
      });
      return;
    }

    const character = await storage.getCharacterInstance(session.characterInstanceId);
    if (!character) {
      await interaction.reply({
        content: '❌ Character not found.',
        ephemeral: true
      });
      return;
    }

    // Use saved options if available and session is waiting for choice, otherwise generate new ones
    let options;
    if (session.currentOptions?.length && session.isWaitingForChoice) {
      options = await gameEngine.getTrainingOptionsByIds(session.currentOptions);
    } else {
      options = await gameEngine.generateTrainingOptions(character, session);
    }
    await this.sendTrainingOptions(interaction.user, character, session, options);

    // Only show message if not in DMs
    if (interaction.guild) {
      await interaction.reply({
        content: '✅ Training session resumed in DMs!',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '✅ Training session resumed!',
        ephemeral: true
      });
    }
  }

  private async handleCOTDCommand(interaction: any) {
    const today = new Date().toISOString().split('T')[0];
    let cotdCharacterId = await storage.getCharacterOfTheDay(today);
    
    // If no COTD for today, use daily featured character
    if (!cotdCharacterId) {
      cotdCharacterId = await getDailyFeaturedCharacter();
      await storage.setCharacterOfTheDay(today, cotdCharacterId);
    }

    const cotdChar = await storage.getBaseCharacter(cotdCharacterId);
    const cotdImageUrl = getCharacterImageUrl(cotdCharacterId);
    
    const embed = new EmbedBuilder()
      .setTitle('⭐ Character of the Day')
      .setDescription(`**${cotdChar?.name}** is today's featured character!`)
      .setColor(Colors.Gold)
      .setThumbnail(cotdImageUrl);

    embed.addFields({
      name: 'COTD Bonus',
      value: '+10pp to all stats when rolling (capped at 115%)',
      inline: false
    });

    if (cotdChar?.description) {
      embed.addFields({
        name: 'Description',
        value: cotdChar.description,
        inline: false
      });
    }

    await interaction.reply({
      embeds: [embed],
      ephemeral: false
    });
  }

  private async handleTrashCandidates(interaction: any, user: User) {
    const candidates = await storage.getUserCharacters(user.id, 'candidate');
    
    for (const candidate of candidates) {
      await storage.updateCharacterInstance(candidate.id, { status: 'discarded' });
    }

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Candidates Discarded')
      .setDescription(`${candidates.length} character candidates have been discarded.`)
      .setColor(Colors.Orange);

    await interaction.update({
      embeds: [embed],
      components: []
    });
  }

  private async handleContinueTraining(interaction: any, user: User) {
    const session = await storage.getTrainingSession(user.id);
    if (!session) {
      await interaction.reply({
        content: '❌ No active training session found.',
        ephemeral: true
      });
      return;
    }

    const character = await storage.getCharacterInstance(session.characterInstanceId);
    if (!character) {
      await interaction.reply({
        content: '❌ Character not found.',
        ephemeral: true
      });
      return;
    }

    // Use saved options if available, otherwise generate new ones
    let options;
    if (session.currentOptions?.length && session.isWaitingForChoice) {
      options = await gameEngine.getTrainingOptionsByIds(session.currentOptions);
    } else {
      options = await gameEngine.generateTrainingOptions(character, session);
    }

    await this.sendTrainingOptions(interaction.user, character, session, options);

    // Only show message if not in DMs
    if (interaction.guild) {
      await interaction.update({
        content: '➡️ Training options sent!',
        components: []
      });
    } else {
      await interaction.deferUpdate();
    }
  }

  private async handleSetActivePvP(interaction: any, user: User, characterId: string) {
    const character = await storage.getCharacterInstance(characterId);
    if (!character || character.userId !== user.id || character.status !== 'locked') {
      await interaction.reply({
        content: '❌ Invalid character selection.',
        ephemeral: true
      });
      return;
    }

    // Clear existing active PvP character
    const existingActive = await storage.getUserActivePvPCharacter(user.id);
    if (existingActive) {
      await storage.updateCharacterInstance(existingActive.id, { isActivePvP: false });
    }

    // Set new active character
    await storage.updateCharacterInstance(characterId, { isActivePvP: true });

    const baseChar = await storage.getBaseCharacter(character.baseCharacterId);
    
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Active PvP Character Set')
      .setDescription(`**${baseChar?.name}** is now your active PvP character!`)
      .setColor(Colors.Green);

    await interaction.update({
      embeds: [embed],
      components: []
    });
  }

  private async handleDeclinePvP(interaction: any, user: User, challengerId: string) {
    // Verify the declining user is the opponent
    if (user.discordId !== interaction.user.id) {
      await interaction.reply({
        content: '❌ Only the challenged player can decline this battle.',
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('❌ Challenge Declined')
      .setDescription('The PvP challenge has been declined.')
      .setColor(Colors.Red);

    await interaction.update({
      embeds: [embed],
      components: []
    });
  }

  async start() {
    await this.client.login(this.token);
  }

  async stop() {
    await this.client.destroy();
  }
}
