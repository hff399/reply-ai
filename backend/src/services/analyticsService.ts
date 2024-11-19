import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AnalyticsInput {
  chatId: string;
  messageId: string;
  userMessage?: string;
  botResponse?: string;
  messageReceivedAt: Date;
  responseSentAt?: Date;
  responseTime?: number;
}

class AnalyticsService {
  // Log analytics data into the database
  static async logAnalytics(data: AnalyticsInput) {
    try {
      await prisma.analytics.create({
        data: {
          chatId: data.chatId,
          messageId: data.messageId,
          userMessage: data.userMessage,
          botResponse: data.botResponse,
          messageReceivedAt: data.messageReceivedAt,
          responseSentAt: data.responseSentAt,
          responseTime: data.responseTime,
        },
      });
      console.log('Analytics entry created');
    } catch (error) {
      console.error('Error logging analytics:', error);
    }
  }

  // Function to track response time and store analytics
  static async trackAnalytics(
    chatId: string,
    messageId: string,
    userMessage: string,
    botResponse: string,
    messageReceivedAt: Date
  ) {
    const responseSentAt = new Date();
    const responseTime = responseSentAt.getTime() - messageReceivedAt.getTime();

    await this.logAnalytics({
      chatId,
      messageId,
      userMessage,
      botResponse,
      messageReceivedAt,
      responseSentAt,
      responseTime,
    });
  }

  static async getLastMonthMessageCounts(): Promise<{ date: string; messages: number }[]> {
    try {
      const currentDate = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(currentDate.getDate() - 30);

      // Debug: Check total rows in the database
      const totalMessages = await prisma.analytics.count();

      // Debug: Check messages within the range
      const messagesInRange = await prisma.analytics.findMany({
        where: {
          messageReceivedAt: {
            gte: thirtyDaysAgo,
            lt: currentDate,
          },
        },
        select: {
          messageReceivedAt: true,
        },
      });

      function transformToDailyStats(messages: any[]): any[] {
        const result: any[] = [];
      
        // Generate dates for today and the previous 29 days
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
          result.unshift({ date: formattedDate, messages: 0 });
        }
      
        // Count messages per day
        messages.forEach(({ messageReceivedAt }) => {
          const messageDate = new Date(messageReceivedAt).toISOString().split('T')[0];
          const day = result.find((day) => day.date === messageDate);
          if (day) {
            day.messages += 1;
          }
        });
      
        return result;
      }

      // Map through all 30 dates and fill with message counts or 0
      const formattedResult = transformToDailyStats(messagesInRange)

      return formattedResult.reverse();
    } catch (error) {
      console.error('Error fetching last 30 days message counts:', error);
      throw new Error('Failed to fetch analytics data');
    }
  }
}

export { AnalyticsService };
