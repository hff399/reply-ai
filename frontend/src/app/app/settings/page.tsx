"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Settings, MessageCircleMore } from 'lucide-react';
import kyClient from '@/lib/ky';

interface BotPreferences {
  isOn: boolean;
  generalPrompt: string;
  responseDelay: number;
  openAiMaxTokens: number;
  openAiTemperature: number;
  analyzeImages: boolean;
  analyzeVoices: boolean;
}

const SettingsPage = () => {
  const [globalSettings, setGlobalSettings] = useState<BotPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatName, setChatName] = useState('');
  
  useEffect(() => {
    kyClient
    .get('settings/global')
    .json<BotPreferences>()
    .then((settings) => {
      setGlobalSettings(settings);
      setIsLoading(false);
    })
    .catch((error) => {
      console.error('Failed to fetch global settings', error);
      setIsLoading(false);
    });
  }, []);
  
  if (typeof window === "undefined") {
    return (<div></div>)
  }
  const handleUpdateGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSettings) {
      try {
        const updatedSettings = kyClient
          .put('settings/global', {
            json: globalSettings,
          })
          .json<BotPreferences>();

        toast.promise(updatedSettings, {
          loading: 'Updating...',
          success: 'Settings updated!',
          error: 'Failed to update settings',
        });
        setGlobalSettings(await updatedSettings); // Update state with response
      } catch (error) {
        console.error('Failed to update global settings', error);
      }
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="px-2 sm:px-8 text-xl font-semibold mb-4">Bot Settings</h1>
      <div className="grid grid-rows-[1fr] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-center justify-items-center p-2 sm:p-8 pb-20 gap-y-4 sm:gap-4 sm:p-20">
        <Card className="col-span-2 w-full h-full">
          <div className="items-center gap-2 relative z-20 flex justify-start border-b px-3 py-2.5 text-muted-foreground [&>svg]:h-[0.9rem] [&>svg]:w-[0.9rem]">
            <Settings />
            <span className="text-sm">General Settings</span>
          </div>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className='flex flex-col'>
                <Skeleton className="h-[84px] mb-4 w-full" />
                <Skeleton className="h-[60px] mb-4 w-full" />
                <Skeleton className="h-[60px] mb-4 w-full" />
                <Skeleton className="h-[60px] mb-4 w-full" />
                <Skeleton className="h-5 mb-4 w-full" />
                <Skeleton className="h-9 w-40" />
              </div>
            ) : globalSettings ? (
              <form onSubmit={handleUpdateGlobal}>
                <div className="mb-4">
                  <Label htmlFor="generalPrompt">General Prompt</Label>
                  <Textarea
                    id="generalPrompt"
                    className='h-96 sm:h-auto'
                    value={globalSettings.generalPrompt}
                    onChange={(e) =>
                      setGlobalSettings({ ...globalSettings, generalPrompt: e.target.value })
                    }
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="responseDelay">Response Delay (ms)</Label>
                  <Input
                    id="responseDelay"
                    type="number"
                    value={globalSettings.responseDelay}
                    onChange={(e) =>
                      setGlobalSettings({ ...globalSettings, responseDelay: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="maxTokens">OpenAI Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={globalSettings.openAiMaxTokens}
                    onChange={(e) =>
                      setGlobalSettings({
                        ...globalSettings,
                        openAiMaxTokens: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="mb-4">
                  <Label htmlFor="temperature">OpenAI Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={globalSettings.openAiTemperature}
                    onChange={(e) =>
                      setGlobalSettings({
                        ...globalSettings,
                        openAiTemperature: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className='flex-col sm:flex-row flex gap-x-6'>
                  <div className="mb-4 flex items-center gap-2">
                    <Switch
                      aria-label="Toggle Bot Status"
                      checked={globalSettings.isOn}
                      onClick={() =>
                        setGlobalSettings({ ...globalSettings, isOn: !globalSettings.isOn })
                      }
                    />
                    <Label>Bot is On</Label>
                  </div>
                  <div className="mb-4 flex items-center gap-2">
                    <Switch
                      aria-label="Toggle Image Analysis"
                      checked={globalSettings.analyzeImages}
                      onClick={() =>
                        setGlobalSettings({
                          ...globalSettings,
                          analyzeImages: !globalSettings.analyzeImages,
                        })
                      }
                    />
                    <Label>Analyze Images</Label>
                  </div>
                  <div className="mb-4 flex items-center gap-2">
                    <Switch
                      aria-label="Toggle Voice Analysis"
                      checked={globalSettings.analyzeVoices}
                      onClick={() =>
                        setGlobalSettings({
                          ...globalSettings,
                          analyzeVoices: !globalSettings.analyzeVoices,
                        })
                      }
                    />
                    <Label>Analyze Voices</Label>
                  </div>
                </div>
                <Button type="submit" className='mt-4 sm:mt-0'>Save Global Settings</Button>
              </form>
            ) : (
              <p>Failed to load settings.</p>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-1 w-full max-h-[490px]">
          <div className="items-center gap-2 relative z-20 flex justify-start border-b px-3 py-2.5 text-muted-foreground [&>svg]:h-[0.9rem] [&>svg]:w-[0.9rem]">
            <MessageCircleMore />
            <span className="text-sm">Enabled Chats</span>
          </div>
          <div className="py-4 px-2">
            <Input
              type="text"
              placeholder="Search Chats"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="mb-4"
            />
            <ChatList />
          </div>
        </Card>
      </div>
    </div>
  );
};
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import ky from "ky"; // Or your preferred HTTP client

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  preferences: {
    isAutoReplyOn: boolean;
  };
}

interface SessionWithChats {
  phoneNumber: string;
  sessionId: string;
  chats: Chat[];
}

const ChatList = () => {
  const [sessions, setSessions] = useState<SessionWithChats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionWithChats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data: SessionWithChats[] = await kyClient.get("chats").json();
        console.log(data);
        setSessions(data);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
        setError("Unable to load sessions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const togglePreference = async (chatId: string, sessionId: string) => {
    const updatedSessions = sessions.map((session) =>
      session.phoneNumber === sessionId
        ? {
            ...session,
            chats: session.chats.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    preferences: {
                      ...chat.preferences,
                      isAutoReplyOn: !chat.preferences.isAutoReplyOn,
                    },
                  }
                : chat
            ),
          }
        : session
    );
    setSessions(updatedSessions);

    try {
      await kyClient.patch(`chats/${chatId}/preference`, {
        json: {
          isAutoReplyOn: updatedSessions
            .find((session) => session.phoneNumber === sessionId)
            ?.chats.find((chat) => chat.id === chatId)?.preferences.isAutoReplyOn,
            phoneNumber: selectedSession?.phoneNumber,
            sessionId: selectedSession?.sessionId
        },
      });
    } catch (err) {
      console.error("Failed to toggle preference:", err);
      setSessions(sessions);
    }
  };

  const filteredChats =
    selectedSession?.chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.phoneNumber}>
              <CardHeader>
                <CardTitle>{session.phoneNumber}</CardTitle>
                <Button onClick={() => setSelectedSession(session)}>
                  View Chats
                </Button>
              </CardHeader>
            </Card>
          ))}

          {selectedSession && (
            <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
              <DialogContent className="max-h-[80%] max-w-[540px] overflow-y-scroll no-scrollbar">
                <DialogHeader className='max-w-full'>
                  <DialogTitle>Chats for {selectedSession.phoneNumber}</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4 max-w-full"
                />
                <CardContent className='max-w-[540px]'>
                  {filteredChats.length > 0 ? (
                    filteredChats.map((chat) => (
                      <div key={chat.id} className="flex items-center max-w-full justify-between py-2 border-b">
                        <div>
                          <div className="font-semibold text-sm">{chat.name}</div>
                          <div className="text-gray-500 text-sm truncate max-w-[400px]">{chat.lastMessage}</div>
                        </div>
                        <Switch
                          checked={chat.preferences.isAutoReplyOn}
                          onCheckedChange={() => {
                            togglePreference(chat.id, selectedSession.phoneNumber)
                            chat.preferences.isAutoReplyOn = !chat.preferences.isAutoReplyOn
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <p>No chats match your search.</p>
                  )}
                </CardContent>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
};


export default SettingsPage;
