import { PrismaClient, BotPreferences, ChatSettings } from '@prisma/client';

const prisma = new PrismaClient();

export const settingsService = {
  // Fetch global bot preferences
  async getGlobalPreferences(): Promise<BotPreferences | null> {
    return await prisma.botPreferences.findFirst(); // Assuming only one global configuration
  },

  // Update or create global bot preferences
  async updateGlobalPreferences(data: Partial<BotPreferences>): Promise<BotPreferences> {
    const globalPreferences = await prisma.botPreferences.findFirst();
    if (globalPreferences) {
      return await prisma.botPreferences.update({
        where: { id: globalPreferences.id },
        data,
      });
    } else {
      // Create a new global preferences record if it doesn't exist
      return await prisma.botPreferences.create({data});
    }
  },

  // Fetch chat-specific settings by chatId
  async getChatSettings(chatId: string, sessionId: number): Promise<ChatSettings | null> {
    return await prisma.chatSettings.findUnique({
      where: { chatId_sessionId: {chatId, sessionId} },
    });
  },

  // Update or create chat-specific settings
  // async upsertChatSettings(chatId: string, data: Partial<ChatSettings>): Promise<ChatSettings> {
  //   return await prisma.chatSettings.upsert({
  //     where: { chatId },
  //     update: data,
  //     create: { ...data, chatId },
  //   });
  // },
};
