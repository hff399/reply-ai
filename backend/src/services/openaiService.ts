import { OpenAI } from 'openai';
import fs from 'fs';
import { OPENAI_API_KEY, OPENAI_BASE_URL } from '../server';

// Define a type for the options that can be passed to the generateCompletion function
interface GenerateCompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

console.log(OPENAI_API_KEY || "sk-tNeqyLG2jVDHNFYC2FwHlyF323N7Ze5t",)

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || "sk-tNeqyLG2jVDHNFYC2FwHlyF323N7Ze5t",
  baseURL: OPENAI_BASE_URL || "https://api.proxyapi.ru/openai/v1",
});

/**
 * Generate a text completion using OpenAI's API.
 * @param prompt - The text prompt to send to the OpenAI model.
 * @param options - Optional configuration for the model (e.g., maxTokens, temperature).
 * @returns A promise that resolves to the generated text.
 */
export async function generateCompletion(
  prompt: string,
  options: GenerateCompletionOptions = {}
): Promise<string> {
  try {
    const completion = await openai.completions.create({
      model: options.model || 'text-davinci-003', // Default to GPT-3's Davinci model
      prompt,
      max_tokens: options.maxTokens || 150, // Default max tokens
      temperature: options.temperature || 0.7, // Default temperature
    });

    // Extract and return the generated text
    return completion.choices[0]?.text?.trim() || '';
  } catch (error: any) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    throw new Error('Failed to generate completion.');
  }
}

/**
 * Generate a chat completion using OpenAI's ChatGPT model.
 * @param messages - An array of message objects for the ChatGPT API.
 * @param options - Optional configuration for the chat completion.
 * @returns A promise that resolves to the generated text.
 */
export async function generateChatCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options: GenerateCompletionOptions = {}
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: options.model || 'gpt-4o-mini', // Default to GPT-4
      messages,
      max_tokens: options.maxTokens || 150, // Default max tokens
      temperature: options.temperature || 2, // Default temperature
    });


    
    // Extract and return the assistant's reply
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error: any) {
    console.error('OpenAI API Chat Error:', error.response?.data || error.message);
    throw new Error('Failed to generate chat completion.');
  }
}



/**
 * Transcribe an audio file using OpenAI's Whisper model (speech-to-text).
 * @param filePath - The local path to the audio file to transcribe.
 * @returns A promise that resolves to the transcribed text.
 */
export async function transcribeAudio(filePath: string): Promise<string | null> {
  try {
    // Read the audio file as a stream
    const fileStream = fs.createReadStream(filePath);

    // Send the file to OpenAI's Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1', // Whisper model name
    });

    // Return the transcribed text
    return transcription.text || null;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return null;
  }
}
