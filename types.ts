import { Chat } from "@google/genai";

export interface SavedPlant {
  id: string;
  name: string;
  details: string; // The full markdown text from Gemini
  savedAt: Date;
  image: string; // The base64 data URL of the user's uploaded image
  completedTasks?: { [taskTitle: string]: boolean };
}

export interface Message {
  id:string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface CommonPlant {
    name: string;
    image: string;
}

export type AppView = 'identification' | 'result' | 'chat' | 'my_plants' | 'common_plants' | 'plant_detail';

export interface ChatSession {
    session: Chat;
    plantContext: string;
}
