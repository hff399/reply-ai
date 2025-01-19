import express from 'express';
import ChatSettingsService from '../services/chatSettingsService'; // Adjust path as necessary
import { globalClients } from '../services/telegramService';
import { Dialog } from 'telegram/tl/custom/dialog';
import { authenticateToken } from '../middleware/authMiddleware';
import prisma from '../utils/prismaClient';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany();

    const sessionsWithChats = await Promise.all(
      sessions.map(async (session) => {
        const { phoneNumber, id: sessionId } = session;
        const client = globalClients[phoneNumber];

        if (!client) {
          return {
            sessionId,
            phoneNumber,
            chats: [],
          };
        }

        const dialogs = await client.getDialogs();

        const telegramChats = dialogs
          .filter((dialog: Dialog) => dialog.entity?.className === 'User')
          .map((dialog: Dialog) => {
            const chat = dialog.entity;
            const lastMessage = dialog.message;

            if (chat?.className === 'User' && chat.id) {
              return {
                id: chat.id.toString(),
                name: chat.lastName
                  ? `${chat.firstName} ${chat.lastName}`
                  : chat.firstName || 'No Name',
                lastMessage: lastMessage?.message || 'No messages',
              };
            }
          })
          .filter(Boolean);

        const mergedChats = await ChatSettingsService.mergeChatsWithPreferences(
          telegramChats
        );

        return {
          sessionId,
          phoneNumber,
          chats: mergedChats,
        };
      })
    );

    res.status(200).json(sessionsWithChats);
    return;
  } catch (error) {
    console.error('Error in GET /chats:', error);
    res.status(500).json({ error: 'Failed to retrieve chats with preferences' });
    return;
  }
});

/**
 * Route: Toggle a Chat's Auto-Reply Preference
 * Method: PATCH
 * Body: { chatId: string, isAutoReplyOn: boolean, sessionId: string }
 */
router.patch('/:chatId/preference', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { isAutoReplyOn, sessionId } = req.body;

  if (typeof isAutoReplyOn !== 'boolean') {
    res.status(400).json({ error: 'isAutoReplyOn must be a boolean' });
    return;
  }

  try {
    const updatedSettings = await ChatSettingsService.upsertChatSettings(
      chatId,
      Number(sessionId),
      { sessionId, isAutoReplyOn },
    );

    res.status(200).json(updatedSettings);
    return;
  } catch (error) {
    console.error('Error in PATCH /chats/:chatId/preference:', error);
    res.status(500).json({ error: 'Failed to update preference' });
    return;
  }
});

export default router;
