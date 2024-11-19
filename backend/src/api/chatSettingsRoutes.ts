import express from 'express';
import ChatSettingsService from '../services/chatSettingsService'; // Adjust path as necessary
import { globalClient } from '../services/telegramService';
import { Dialog } from 'telegram/tl/custom/dialog';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {

    // Fetch all chats from the Telegram account
    const dialogs = await globalClient!.getDialogs(); // Get all dialogs (chats)

    // Prepare the chat data to return
    const telegramChats = dialogs.filter((dialog: Dialog) => {
      return dialog.entity?.className == "User"
    }).map((dialog: Dialog) => {
      const chat = dialog.entity;

      const lastMessage = dialog.message;

      if (chat?.className == "User") { 
        return {
          id: chat?.id,
          name: chat?.lastName ? chat?.firstName + " " + chat?.lastName : chat?.firstName || 'No Name', // Use title or username
          lastMessage: lastMessage?.message || 'No messages', // Last message text
        };
      }
    });

    const mergedChats = await ChatSettingsService.mergeChatsWithPreferences(telegramChats);
    res.status(200).json(mergedChats);
    return
  } catch (error) {
    console.error('Error in GET /chats:', error);
    res.status(500).json({ error: 'Failed to retrieve chats with preferences' });
    return
  }
});

/**
 * Route: Toggle a Chat's Auto-Reply Preference
 * Method: PATCH
 * Body: { chatId: string, isAutoReplyOn: boolean }
 */
router.patch('/:chatId/preference', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { isAutoReplyOn } = req.body;

  if (typeof isAutoReplyOn !== 'boolean') {
    res.status(400).json({ error: 'isAutoReplyOn must be a boolean' });
    return 
  }

  try {
    const updatedSettings = await ChatSettingsService.upsertChatSettings(chatId, { isAutoReplyOn });

    res.status(200).json(updatedSettings);
    return
  } catch (error) {
    console.error('Error in PATCH /chats/:chatId/preference:', error);
    res.status(500).json({ error: 'Failed to update preference' });
    return
  }
});


export default router