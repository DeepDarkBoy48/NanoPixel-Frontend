import request from "@/utils/request.js";
import { AnalysisResult, DictionaryResult, WritingResult, Message, WritingMode, ModelLevel } from "../types";

// --- Audio Helper Functions ---
// Shared context for decoding only, to avoid creating new contexts repeatedly
let sharedDecodeContext: AudioContext | null = null;

function getDecodeContext() {
  if (!sharedDecodeContext) {
    // Safari/Webkit compat
    sharedDecodeContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return sharedDecodeContext;
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Public Services ---

export const analyzeSentenceService = (sentence: string, modelLevel: ModelLevel = 'mini'): Promise<AnalysisResult> => {
  return request.post('/fastapi/analyze', { sentence, modelLevel }) as Promise<AnalysisResult>;
};

export const lookupWordService = (word: string, modelLevel: ModelLevel = 'mini'): Promise<DictionaryResult> => {
  return request.post('/fastapi/lookup', { word, modelLevel }) as Promise<DictionaryResult>;
};

export const evaluateWritingService = (text: string, mode: WritingMode, modelLevel: ModelLevel = 'mini'): Promise<WritingResult> => {
  return request.post('/fastapi/writing', { text, mode, modelLevel }) as Promise<WritingResult>;
};

export const getChatResponseService = async (
  history: Message[],
  contextContent: string | null,
  userMessage: string,
  contextType: 'sentence' | 'word' | 'writing' = 'sentence'
): Promise<string> => {
  const result = await request.post('/fastapi/chat', {
    history,
    contextContent,
    userMessage,
    contextType
  }) as { response: string };
  return result.response;
};

export const generateSpeechService = async (text: string): Promise<AudioBuffer> => {
  const result = await request.post('/fastapi/tts', { text }) as { audioData: string };
  const base64Audio = result.audioData;

  if (!base64Audio) {
    throw new Error("No audio data received");
  }

  // Use the shared context for decoding to be efficient
  const decodeCtx = getDecodeContext();

  const audioBuffer = await decodeAudioData(
    decode(base64Audio),
    decodeCtx,
    24000,
    1,
  );

  return audioBuffer;
};
