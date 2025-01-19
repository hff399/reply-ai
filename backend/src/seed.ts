import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";
import { ADMIN_PASSWORD } from './server';

const prisma = new PrismaClient();

// Helper function to generate random messages and response times
const generateRandomMessage = () => {
  const messages = [
    'Hello, how can I help you today?',
    'I need assistance with my account.',
    'What can you do for me?',
    'Tell me a joke!',
    'Can you provide some information?',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

const generateRandomResponseTime = () => {
  return Math.floor(Math.random() * (5000 - 100 + 1) + 100); // Random response time between 100 and 5000ms
};

async function seed() {
  // Check if BotPreferences exists, if not, create initial data
  const existingBotPreferences = await prisma.botPreferences.findFirst();

  if (!existingBotPreferences) {
    const botPreferences = await prisma.botPreferences.create({
      data: {
        isOn: false,
        generalPrompt: 'Hello! How can I assist you today?',
        responseDelay: 5000,
        openAiMaxTokens: 150,
        openAiTemperature: 0.7,
      },
    });
    console.log('Created BotPreferences:', botPreferences);
  } else {
    console.log('BotPreferences already exists');
  }

  // Check if the user exists, if not, create a default user
  const existingUser = await prisma.user.findFirst();

  const hashedPassword = bcrypt.hash(ADMIN_PASSWORD!, 10, async (err, hash) => {
    if (err) {
      // Handle error
      console.log(err)
      return;
    }
    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          name: 'admin',
          password: hash, // Replace this with a securely hashed password
        },
      });
      console.log('Created User:', user);
    } else {
      console.log('User already exists');
    }
  });

  // Generate random analytics data for the last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30); // Subtract 30 days from today

  // // Generate analytics messages for each day from today to 30 days ago
  // for (let currentDate = thirtyDaysAgo; currentDate <= today; currentDate.setDate(currentDate.getDate() + 1)) {
  //   const messageCount = Math.floor(Math.random() * (100 - 10 + 1) + 10); // Between 10 and 100 messages for each day

  //   // Generate messages for the specific date
  //   for (let i = 0; i < messageCount; i++) {
  //     const messageReceivedAt = new Date(currentDate);
  //     messageReceivedAt.setMilliseconds(messageReceivedAt.getMilliseconds() + i * 1000); // Space out messages 1 second apart for this day

  //     const responseSentAt = new Date(messageReceivedAt.getTime() + generateRandomResponseTime());
  //     const responseTime = responseSentAt.getTime() - messageReceivedAt.getTime(); // Response time in ms

  //     await prisma.analytics.create({
  //       data: {
  //         chatId: `chat_${Math.floor(Math.random() * 1000)}`, // Simulating random chat IDs
  //         messageId: `msg_${Math.floor(Math.random() * 100000)}`,
  //         userMessage: generateRandomMessage(),
  //         botResponse: generateRandomMessage(),
  //         messageReceivedAt,
  //         responseSentAt,
  //         responseTime,
  //       },
  //     });

  //     console.log(`Created message for date ${messageReceivedAt}`);
  //   }
  // }

  console.log('Initial data created successfully');
}


export default seed