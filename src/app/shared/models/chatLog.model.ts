export interface ChatLog {
  id: string;
  userId: string;
  message: string;
  isBot: boolean;
  agentId?: string;
  context?: string;
  intent?: string;
  createdAt: Date;
}

export interface QuickReply {
  id: string;
  text: string;
  intent: string;
}

export interface ChatState {
  isOpen: boolean;
  isTyping: boolean;
  messages: ChatLog[];
  currentContext?: string;
}