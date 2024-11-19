import { Prisma, ChatSettings, PrismaClient } from '@prisma/client'; // Import necessary Prisma types

const prisma = new PrismaClient();

export interface ChatSettingsInput {
  botPreferencesId?: number; // Reference to BotPreferences (optional)
  customPrompt?: string; // Custom prompt for the chat
  isAutoReplyOn?: boolean; // Auto-reply setting
  responseDelay?: number; // Custom response delay
}

class ChatSettingsService {
  /**
   * Create or update chat settings for a specific chat.
   * @param chatId - Unique identifier for the chat.
   * @param settings - Partial settings object for the chat.
   * @returns The created or updated chat settings.
   */
  static async upsertChatSettings(
    chatId: string,
    settings: ChatSettingsInput
  ): Promise<ChatSettings> {
    try {
      const updatedSettings = await prisma.chatSettings.upsert({
        where: { chatId },
        update: {
          ...settings,
          updatedAt: new Date(),
        },
        create: {
          chatId,
          isAutoReplyOn: settings.isAutoReplyOn ?? true, // Default to true if not provided
          ...settings,
        },
      });
      return updatedSettings;
    } catch (error) {
      console.error('Error in upsertChatSettings:', error);
      throw new Error('Failed to upsert chat settings.');
    }
  }

  /**
   * Get settings for a specific chat.
   * @param chatId - Unique identifier for the chat.
   * @returns The chat settings, or null if not found.
   */
  static async getChatSettings(chatId: string): Promise<ChatSettings | null> {
    try {
      const chatSettings = await prisma.chatSettings.findUnique({
        where: { chatId },
      });
      return chatSettings;
    } catch (error) {
      console.error('Error in getChatSettings:', error);
      throw new Error('Failed to retrieve chat settings.');
    }
  }

  /**
   * Update settings for a specific chat.
   * @param chatId - Unique identifier for the chat.
   * @param settings - Partial settings object for the chat.
   * @returns The updated chat settings.
   */
  static async updateChatSettings(
    chatId: string,
    settings: Partial<ChatSettingsInput>
  ): Promise<ChatSettings> {
    try {
      const updatedSettings = await prisma.chatSettings.update({
        where: { chatId },
        data: {
          ...settings,
          updatedAt: new Date(),
        },
      });
      return updatedSettings;
    } catch (error) {
      console.error('Error in updateChatSettings:', error);
      throw new Error('Failed to update chat settings.');
    }
  }

  /**
   * Delete settings for a specific chat.
   * @param chatId - Unique identifier for the chat.
   * @returns The deleted chat settings.
   */
  static async deleteChatSettings(chatId: string): Promise<ChatSettings> {
    try {
      const deletedSettings = await prisma.chatSettings.delete({
        where: { chatId },
      });
      return deletedSettings;
    } catch (error) {
      console.error('Error in deleteChatSettings:', error);
      throw new Error('Failed to delete chat settings.');
    }
  }

  /**
   * List all chat settings with optional filters.
   * @param filter - Optional filter object for retrieving chat settings.
   * @returns An array of chat settings.
   */
  static async listChatSettings(
    filter?: Prisma.ChatSettingsWhereInput
  ): Promise<ChatSettings[]> {
    try {
      const chatSettings = await prisma.chatSettings.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' }, // Order by most recently created
      });
      return chatSettings;
    } catch (error) {
      console.error('Error in listChatSettings:', error);
      throw new Error('Failed to list chat settings.');
    }
  }


  /**
   * Merge Telegram chats with stored preferences from the database.
   * @param telegramChats - List of chats from Telegram API.
   * @returns Array of merged chat data with preferences.
   */
  static async mergeChatsWithPreferences(telegramChats: Array<{ id: bigInt.BigInteger; name: string, lastMessage: string } | undefined>) {
    try {
      const chatIds = telegramChats.map(chat => chat!.id.toString());
      const preferences = await prisma.chatSettings.findMany({
        where: { chatId: { in: chatIds } },
      });

      const preferencesMap = new Map(preferences.map(pref => [pref.chatId, pref]));

      return telegramChats.map(chat => ({
        id: chat?.id,
        name: chat?.name,
        lastMessage: chat?.lastMessage,
        preferences: preferencesMap.get(chat!.id.toString()) || { isAutoReplyOn: false, customPrompt: null },
      }));
    } catch (error) {
      console.error('Error in mergeChatsWithPreferences:', error);
      throw new Error('Failed to merge chats with preferences.');
    }
  }


  /**
   * Fetch all enabled chats where isAutoReplyOn is true.
   * @returns {Promise<string[]>} List of enabled chat IDs.
   */
  static async getEnabledChats(): Promise<string[]> {
    try {
      const enabledChats = await prisma.chatSettings.findMany({
        where: {
          isAutoReplyOn: true,
        },
        select: {
          chatId: true, // Only fetch chatId
        },
      });
      return enabledChats.map((chat) => chat.chatId);
    } catch (error) {
      console.error('Failed to fetch enabled chats:', error);
      return [];
    }
  }
}

export default ChatSettingsService;
