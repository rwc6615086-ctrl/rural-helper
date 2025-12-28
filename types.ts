
export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  date: string;
}

export interface AssessmentData {
  childName: string;
  childAge: number;
  childGender: string;
  sleep: string;
  electronics: string;
  peerRel: string;
  concerns: string[];
  photo: string;
  notes: string;
  details: string; // Added detailed description
}

export interface StoryData {
  title: string;
  content: string;
  moral: string[];
}

export interface Resource {
  id: number;
  title: string;
  tags: string[];
  type: 'guide' | 'activity' | 'technique' | 'tool';
  age: 'all' | 'teen' | 'kid';
  content: string;
}
