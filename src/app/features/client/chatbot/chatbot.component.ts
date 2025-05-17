import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat/chat.service';
import { ChatMessageComponent } from './chat-message/chat-message.component';
import { ChatLog , ChatState , QuickReply } from '../../../shared/models/chatLog.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatMessageComponent],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  
  chatState: ChatState = {
    isOpen: false,
    isTyping: false,
    messages: []
  };
  
  newMessage: string = '';
  quickReplies: QuickReply[] = [];
  private subscription = new Subscription();
  
  constructor(private chatService: ChatService) {}
  
  ngOnInit(): void {
    this.subscription.add(
      this.chatService.chatState$.subscribe(state => {
        this.chatState = state;
        this.quickReplies = this.chatService.getQuickReplies();
        setTimeout(() => this.scrollToBottom(), 0);
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  toggleChat(): void {
    this.chatService.toggleChat();
    if (this.chatState.isOpen) {
      setTimeout(() => {
        this.messageInput?.nativeElement?.focus();
        this.scrollToBottom();
      }, 100);
    }
  }
  
  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    
    this.chatService.sendMessage(this.newMessage);
    this.newMessage = '';
    setTimeout(() => this.messageInput?.nativeElement?.focus(), 0);
  }
  
  useQuickReply(reply: QuickReply): void {
    this.chatService.sendMessage(reply.text);
  }
  
  clearHistory(): void {
    this.chatService.clearHistory();
  }
  
  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    } catch (err) {}
  }
  
  // Pour les tests d'animation
  get typingMessage(): ChatLog {
    return {
      id: 'typing',
      userId: 'system',
      message: '',
      isBot: true,
      createdAt: new Date()
    };
  }
}