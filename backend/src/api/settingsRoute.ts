import { Router, Response } from 'express';
import { settingsService } from '../services/settingsService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router: Router = Router();

// Get global bot preferences (protected)
router.get('/global', authenticateToken, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const preferences = await settingsService.getGlobalPreferences();
    res.json(preferences || { message: 'No global preferences found' });
    return
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch global preferences' });
    return
  }
});

// Update global bot preferences (protected)
router.put('/global', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedPreferences = await settingsService.updateGlobalPreferences(req.body);
    res.json(updatedPreferences);
    return
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update global preferences' });
  }
});

// Get chat-specific settings by chatId (protected)
// router.get('/chat/:chatId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
//   const { chatId } = req.params;
//   try {
//     const chatSettings = await settingsService.getChatSettings(chatId);
//     if (chatSettings) {
//       res.json(chatSettings);
//       return
//     } else {
//       res.status(404).json({ message: 'Chat settings not found' });
//       return
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to fetch chat settings' });
//   }
// });

// // Update or create chat-specific settings (protected)
// router.put('/chat/:chatId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
//   const { chatId } = req.params;
//   try {
//     const updatedSettings = await settingsService.upsertChatSettings(chatId, req.body);
//     res.json(updatedSettings);
//     return
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to update chat settings' });
//   }
// });

export default router;
