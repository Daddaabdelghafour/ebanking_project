import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatLog } from '../../../../shared/models/chatLog.model';
@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.css']
})
export class ChatMessageComponent {
  @Input() message!: ChatLog;
  @Input() isTyping: boolean = false;
}