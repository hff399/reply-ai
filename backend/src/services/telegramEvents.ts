import { Api, TelegramClient } from 'telegram';
import { NewMessage } from 'telegram/events';
import fs from 'fs';
import { OpenAI } from 'openai'; // Assuming OpenAI service is set up as in your example
import { transcribeAudio } from './openaiService'; // Import transcribeAudio from your OpenAI service
import { generateChatCompletion } from './openaiService'; // Your OpenAI service for chat completions
import { settingsService } from './settingsService';
import { AnalyticsService } from './analyticsService';
import path from 'path';
import bigInt from 'big-integer';
import ChatSettingsService from './chatSettingsService';

// Define the path for saving the downloaded audio file
const downloadDir = path.join(__dirname, 'downloads');

// Convert file to base64 string
function convertFileToBase64(filePath: string): string {
  const file = fs.readFileSync(filePath);
  return file.toString('base64');
}

// Ensure the 'downloads' directory exists
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

// Extend the cache to include enabled chats
const cache = {
  parameters: null as any,
  enabledChats: new Array<string>(), // Use a Set for quick lookup
  lastUpdated: 0,
};

// Fetch enabled chats from DB or API
async function fetchEnabledChats() {
  const enabledChats = await ChatSettingsService.getEnabledChats(); // Assume this returns an array of enabled chat IDs
  cache.enabledChats = enabledChats; // Convert IDs to string
}

// Periodically refresh the cache (bot parameters + enabled chats)
async function refreshCache() {
  await Promise.all([getCachedBotParameters(), fetchEnabledChats()]);
}

// Call `refreshCache` at intervals or at app start
setInterval(refreshCache, 30 * 1000); // Refresh every 10 seconds
refreshCache(); // Initial call

// Fetch cached bot parameters or refresh
async function getCachedBotParameters() {
  const now = Date.now();
  const cacheDuration = 10 * 1000; // 10 seconds

  if (!cache.parameters || now - cache.lastUpdated > cacheDuration) {
    console.log('Fetching new bot parameters...');
    cache.parameters = await settingsService.getGlobalPreferences(); // Fetch from DB or API
    cache.lastUpdated = now;
  } else {
    console.log('Using cached bot parameters...');
  }

  return cache.parameters;
}

// Utility to handle delay
async function addDelay(delayMs: number) {
  if (delayMs > 0) {
    console.log(`Adding a delay of ${delayMs}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

// Format messages for OpenAI context
function formatMessagesForContext(recentMessages: any[], myId: string, generalPrompt?: string) {
  const contextMessages: { role: "user" | "assistant" | "system"; content: string | any }[] = recentMessages.reverse().map((msg) => {
    const role: "user" | "assistant" = msg.senderId?.toString() === myId ? "assistant" : "user";
    return { role, content: msg.message || '[Non-text message]' };
  });

  if (generalPrompt) {
    contextMessages.unshift({ role: "system", content: generalPrompt });
  }

  return contextMessages;
}

// Download and save media
async function downloadAndSaveMedia(message: any, messageId: string) {
  const file = await message.downloadMedia();

  if (file) {
    const filePath = path.join(downloadDir, `${messageId}.mp3`);

    if (typeof file === 'string' || file instanceof Buffer) {
      fs.writeFileSync(filePath, file); // Save the audio file temporarily
      return filePath;
    } else {
      console.error('Invalid file type for saving the audio');
      return null;
    }
  } else {
    console.log('Failed to download media.');
    return null;
  }
}

// Process audio transcription and add to context
async function processAudioTranscription(filePath: string, contextMessages: any[]) {
  const transcription = await transcribeAudio(filePath);

  if (transcription) {
    console.log('Audio Transcription:', transcription);
    contextMessages.push({
      role: 'user',
      content: transcription,
    });

    // Delete the downloaded audio file after use
    fs.unlinkSync(filePath);
    console.log('Downloaded audio file deleted:', filePath);
  } else {
    console.log('Failed to transcribe audio.');
  }
}

// Download and convert media to base64 (for both images and audio)
async function downloadMediaAndConvertToBase64(message: any): Promise<string | null> {
  const file = await message.downloadMedia();
  
  if (file) {
    let base64String: string | null = null;

    if (file instanceof Buffer) {
      base64String = file.toString('base64');
    } else if (typeof file === 'string') {
      const filePath = path.join(__dirname, 'downloads', path.basename(file)); // Temporary path for file download
      fs.writeFileSync(filePath, file);
      base64String = convertFileToBase64(filePath);
      fs.unlinkSync(filePath); // Clean up the temporary file after conversion
    }

    return base64String;
  } else {
    console.log('Failed to download media.');
    return null;
  }
}

// Process message and handle media (audio, images)
async function handleMessage(client: TelegramClient, event: any, myId: string) {
  const message = event.message;
  const chatId = message.chatId;
  const messageText = message.text;
  const messageId = message.id.toString();

  const botParameters = await getCachedBotParameters();
  const recentMessages = await client.getMessages(chatId, { limit: 10 });
  const contextMessages = formatMessagesForContext(recentMessages, myId, botParameters.generalPrompt);

  // Check if the message sender is not the bot and if the chat ID is one of the specified ones
  if ((cache.enabledChats.includes(chatId.toString()))) {
    console.log('New message received:', { chatId, messageText });

    let hasContent = false;

    // Check for voice message only if analyzeVoices is enabled
    if (message.media && message.media.className == 'MessageMediaDocument' && message.media.voice && botParameters.analyzeVoices) {
      const filePath = await downloadAndSaveMedia(message, messageId);  // Download without converting to base64

      if (filePath) {
        const transcription = await transcribeAudio(filePath); // Transcribe the downloaded audio file

        if (transcription && transcription.trim() !== '') {
          console.log('Audio Transcription:', transcription);
          contextMessages.push({
            role: 'user',
            content: transcription,
          });
          hasContent = true;
        } else {
          console.log('Empty or failed audio transcription.');
        }

        // Clean up the file after transcription
        fs.unlinkSync(filePath);
        console.log('Downloaded audio file deleted:', filePath);
      }
    }

    // Check for images only if analyzeImages is enabled
    if (message.media && message.media.className == 'MessageMediaPhoto' && botParameters.analyzeImages) {
      const base64Image = await downloadMediaAndConvertToBase64(message);

      if (base64Image) {
        console.log('Image converted to base64');
        contextMessages.push({
          role: 'user',
          content: [{ type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }], // Base64 encoded image
        });
        hasContent = true;
      }
    }

    // If there's text content, add it to the context
    if (messageText) {
      contextMessages.push({
        role: 'user' as "user" | "system" | "assistant",
        content: messageText,
      });
      hasContent = true;
    }

    // If no valid content (text, image, or valid audio), prevent fallback response
    if (!hasContent) {
      console.log('No valid content in the message');
      return null; // Simply return null to avoid sending a fallback response
    }

    return contextMessages;
  } else {
    console.log('Ignoring message from bot or unknown chat.');
    return null;
  }
}


// Generate OpenAI response
async function generateResponse(contextMessages: any[], botParameters: any) {
  const openAiResponse = await generateChatCompletion(contextMessages, {
    maxTokens: botParameters.openAiMaxTokens,
    temperature: botParameters.openAiTemperature,
  });

  console.log('OpenAI Response:', openAiResponse);
  return openAiResponse;
}

// Track analytics
async function trackAnalytics(chatId: string, messageId: string, messageText: string, openAiResponse: string) {
  await AnalyticsService.trackAnalytics(chatId.toString(), messageId, messageText || '', openAiResponse, new Date());
}

// Send message
async function sendResponse(client: TelegramClient, chatId: string, openAiResponse: string, message: any) {
  console.log('Sending response...');
  await client.sendMessage(chatId, {
    message: openAiResponse,
    replyTo: message,
  });
}

// Start listening for messages
export function startListeningForMessages(client: TelegramClient) {
  console.log('Started listening for messages...');

  client.addEventHandler(async (event) => {
    try {
      const message = event.message;
      const chatId = message.chatId;
      const myId = (await client.getMe()).id.toString(); // Ensure myId is a string


      if (message && chatId) {
        const botParameters = await getCachedBotParameters();

        // Check if the bot is enabled
        if (!botParameters.isOn) {
          console.log('Bot is disabled. Ignoring message.');
          return;
        }

        // Handle message and generate context
        const contextMessages = await handleMessage(client, event, myId);

        if (contextMessages) {
          // Generate OpenAI response
          const openAiResponse = await generateResponse(contextMessages, botParameters);

          // Add response delay if configured
          await addDelay(botParameters.responseDelay);

          // Track and log analytics data
          await trackAnalytics(chatId.toString(), message.id.toString(), message.text || '', openAiResponse);

          // Send the response to the user
          await sendResponse(client, chatId.toString(), openAiResponse, message);
        } else {
          console.log('no context messages')
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }, new NewMessage());
}
