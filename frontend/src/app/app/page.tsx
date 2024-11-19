'use client';

import React from 'react';

import {
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import {
  AreaChart,
  CartesianGrid,
  XAxis,
  Area,
} from 'recharts';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'; // Adjust import based on your project structure
import TelegramAuth from '@/components/telegram-auth';

const chartConfig = {
  visitors: {
    label: 'Messages',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const App = () => {
  // const [timeRange, setTimeRange] = useState('30d'); // Time range state
  const [chartData, setChartData] =
    useState<{ date: string; messages: number }[]>(); // State to store dynamic chart data


  // // Fetch the chart data from the backend/API
  useEffect(() => {
    // Fetch user data
    async function fetchUserData() {
      try {
        const response = await kyClient.get('analytics/overview');
        const data = await response.json();
        setChartData((data as { date: string; messages: number }[]).reverse());
        console.log('User data:', data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    fetchUserData();
  }, []);

  // // Calculate total visitors from chart data
  // const totalVisitors = useMemo(() => {
  //   return chartData.reduce((acc, curr) => acc + curr.messages, 0);
  // }, [chartData]);

  return (
    <div className='grid grid-rows-[1fr] grid-cols-1 lg:grid-cols-3 items-center justify-items-center p-2 sm:p-8 pb-20 gap-y-4 sm:gap-4 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
      {/* Card 4 (Spanning two columns) */}
      <Card className='col-span-2 w-full h-full flex flex-col'>
        <div className='items-center gap-2 relative z-20 flex justify-start border-b px-3 py-2.5 text-card-foreground'>
          <div className='flex items-center gap-1.5 pl-1 text-[13px] text-muted-foreground [&>svg]:h-[0.9rem] [&>svg]:w-[0.9rem]'>
            <MessageCircle></MessageCircle>
            Messages
          </div>
        </div>
        <CardHeader className='items-center pb-0'>
          <CardTitle>Amount Of Messages</CardTitle>
          <CardDescription>
            {(() => {
              const today = new Date(); // Get today's date
              const startDate = new Date(); // Initialize the start date
              startDate.setDate(today.getDate() - 29); // Subtract 30 days from today

              const formattedStartDate = startDate.toLocaleDateString(
                'en-US',
              );
              const formattedTodayDate = today.toLocaleDateString(
                'en-US',
              );

              return `${formattedStartDate} - ${formattedTodayDate}`;
            })()}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex-1 pb-0'>
          {chartData ?
            <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[250px] w-full'
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id='fillDesktop' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='hsl(var(--chart-2))'
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor='hsl(var(--chart-2))'
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id='fillMobile' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='hsl(var(--chart-5))'
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor='hsl(var(--chart-5))'
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    }}
                    indicator='dot'
                  />
                }
              />
              <Area
                dataKey='messages'
                type='natural'
                fill='url(#fillMobile)'
                stroke='hsl(var(--chart-5))'
                stackId='a'
              />
            </AreaChart>
          </ChartContainer>
          : <Skeleton className='w-full h-[226px] mb-6 rounded-xl'/>}
        </CardContent>
      </Card>

      {/* Card 5 */}
      <TelegramCard />
    </div>
  );
};

import { useState, useEffect } from 'react';
import ky from 'ky'; // Import ky for HTTP requests
import { Skeleton } from '@/components/ui/skeleton';
import kyClient from '@/lib/ky';
import getCookie from '@/lib/cookie';



// Component for displaying the Telegram authorization status
const TelegramCardContent = () => {
  const [isVerified, setIsVerified] = useState(false); // Holds the verification status
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    if (document) {
      const phone = getCookie('phone');
      if (phone) {
        console.log('Phone:', phone);
      } else {
        console.error('Phone cookie not found');
      }
      // Example API call to check if the Telegram account is verified
      const checkVerificationStatus = async () => {
        try {
        const response = await ky
          .post('http://localhost:3001/api/telegram/auth/session-status', {
            json: { phone },
          })
          .json(); // Replace with your backend endpoint
          
          // Assert the response type to have the shape { valid: boolean }
          const typedResponse = response as { valid: boolean };
          
          console.log(typedResponse);
          if (typedResponse.valid) {
            console.log('ldkfsjkdf');
            setIsVerified(true);
          }
        } catch (error) {
          console.error('Error checking verification status:', error);
        } finally {
          setIsLoading(false);
        }
        
      }
      checkVerificationStatus();
    } else {
      return
    };
  
  }, []);
  return (
    <div>
      {isLoading ? (
        <div className='w-full h-full flex items-center justify-center'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className={'animate-spin text-border'}
          >
            <path d='M21 12a9 9 0 1 1-6.219-8.56' />
          </svg>
        </div>
      ) : isVerified ? (
        <div className='flex flex-col items-center gap-4 mb-8'>
          <div className='relative animate-blur-in'>
            <ShieldCheck className=' text-green-500' size={160} />
            <ShieldCheck
              className=' absolute text-green-300 blur-md top-0 left-0'
              size={160}
            />
          </div>
        </div>
      ) : (
        <div className='flex items-center gap-2'>
          <TelegramAuth />
        </div>
      )}
    </div>
  );
};

const TelegramCard = () => {
  return (
    <Card className='w-full h-full flex flex-col'>
      <div className='items-center gap-2 relative z-20 flex justify-start border-b px-3 py-2.5 text-card-foreground'>
        <div className='flex items-center gap-1.5 pl-1 text-[13px] text-muted-foreground [&>svg]:h-[0.9rem] [&>svg]:w-[0.9rem]'>
          <ShieldCheck className='text-green-700' />
          Telegram Authorization
        </div>
      </div>
      <CardHeader className='items-center pb-6'>
        <CardTitle>Telegram Authorization</CardTitle>
        <CardDescription>Telegram Account Session</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-0'>
        <TelegramCardContent />
      </CardContent>
    </Card>
  );
};

export default App;
