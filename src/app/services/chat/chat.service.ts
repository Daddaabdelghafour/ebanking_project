import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { ChatLog , ChatState , QuickReply } from '../../shared/models/chatLog.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = '/api/chat'; // À remplacer par votre URL API
  private userId = 'client1'; // À remplacer par l'ID utilisateur actuel
  
  // Gestion de l'état du chat
  private chatState: ChatState = {
    isOpen: false,
    isTyping: false,
    messages: []
  };
  
  private chatSubject = new BehaviorSubject<ChatState>(this.chatState);
  public chatState$ = this.chatSubject.asObservable();
  
  // Suggestions rapides par défaut
  private defaultQuickReplies: QuickReply[] = [
    { id: 'balance', text: 'Consulter mon solde', intent: 'CHECK_BALANCE' },
    { id: 'transfer', text: 'Effectuer un virement', intent: 'TRANSFER' },
    { id: 'help', text: 'Aide générale', intent: 'HELP' }
  ];

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadHistory();
  }
  
  // Charger l'historique des messages
  private loadHistory(): void {
    // Vérifier si nous sommes dans le navigateur avant d'accéder à localStorage
    if (isPlatformBrowser(this.platformId)) {
      const savedMessages = localStorage.getItem('chat_history');
      if (savedMessages) {
        try {
          const messages = JSON.parse(savedMessages) as ChatLog[];
          this.updateState({ messages });
        } catch (e) {
          console.error('Erreur lors du chargement de l\'historique de chat:', e);
          this.initChat();
        }
      } else {
        this.initChat();
      }
    } else {
      // Côté serveur - initialiser avec un état vide
      this.initChat();
    }
  }
  
  // Initialiser le chat avec un message de bienvenue
  private initChat(): void {
    const welcomeMessage: ChatLog = {
      id: `bot_${Date.now()}`,
      userId: this.userId,
      message: "Bonjour, je suis votre assistant bancaire virtuel. Comment puis-je vous aider aujourd'hui?",
      isBot: true,
      context: 'welcome',
      intent: 'GREETING',
      createdAt: new Date()
    };
    
    this.updateState({ 
      messages: [welcomeMessage],
      currentContext: 'welcome'
    });
    this.saveHistory();
  }
  
  // Mettre à jour l'état du chat
  private updateState(partialState: Partial<ChatState>): void {
    this.chatState = { ...this.chatState, ...partialState };
    this.chatSubject.next(this.chatState);
  }
  
  // Sauvegarder l'historique des messages
  private saveHistory(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('chat_history', JSON.stringify(this.chatState.messages));
      } catch (e) {
        console.error('Erreur lors de la sauvegarde de l\'historique de chat:', e);
      }
    }
  }
  
  // Ouvrir/fermer le chatbot
  toggleChat(): void {
    this.updateState({ isOpen: !this.chatState.isOpen });
    
    // Si on ouvre le chat et qu'il n'y a pas de messages, initialiser le chat
    if (this.chatState.isOpen && this.chatState.messages.length === 0) {
      this.initChat();
    }
  }
  
  // Envoyer un message
  sendMessage(message: string): void {
    if (!message?.trim()) return;
    
    // Ajouter le message utilisateur
    const userMessage: ChatLog = {
      id: `user_${Date.now()}`,
      userId: this.userId,
      message: message,
      isBot: false,
      createdAt: new Date()
    };
    
    // Mettre à jour l'état avec le message utilisateur
    this.updateState({ 
      messages: [...this.chatState.messages, userMessage],
      isTyping: true 
    });
    this.saveHistory();
    
    // Dans une app réelle, appel API ici
    this.getResponse(message).subscribe(botResponse => {
      // Ajouter la réponse du bot après un délai pour simuler la frappe
      this.updateState({
        messages: [...this.chatState.messages, botResponse],
        isTyping: false,
        currentContext: botResponse.context
      });
      this.saveHistory();
    });
  }
  
  // Effacer l'historique
  clearHistory(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('chat_history');
    }
    this.updateState({ messages: [] });
    this.initChat();
  }
  
  // Simuler une réponse du bot (à remplacer par un appel API)
  private getResponse(message: string): Observable<ChatLog> {
    let response = '';
    let intent = '';
    let context = this.chatState.currentContext || 'general';
    
    // Logique simple de réponse basée sur des mots-clés
    const lowercaseMsg = message.toLowerCase();
    
    if (lowercaseMsg.includes('solde') || lowercaseMsg.includes('balance') || lowercaseMsg.includes('compte')) {
      response = "Votre solde actuel est de 24,500.75 MAD. Souhaitez-vous voir les dernières transactions?";
      intent = 'BALANCE_INFO';
      context = 'account_balance';
    } 
    else if (lowercaseMsg.includes('virement') || lowercaseMsg.includes('transfert') || lowercaseMsg.includes('envoyer argent')) {
      response = "Pour effectuer un virement, veuillez accéder à la section Virements de votre tableau de bord. Puis-je vous aider avec autre chose?";
      intent = 'TRANSFER_INFO';
      context = 'transfers';
    }
    else if (lowercaseMsg.includes('carte') || lowercaseMsg.includes('card')) {
      response = "Vous avez 2 cartes actives. Souhaitez-vous plus d'informations sur l'une de vos cartes ou commander une nouvelle carte?";
      intent = 'CARD_INFO';
      context = 'cards';
    }
    else if (lowercaseMsg.includes('facture') || lowercaseMsg.includes('bill') || lowercaseMsg.includes('paiement')) {
      response = "Vous avez 3 factures en attente de paiement. Voulez-vous les consulter ou en payer une?";
      intent = 'BILL_INFO';
      context = 'bills';
    }
    else if (lowercaseMsg.includes('merci') || lowercaseMsg.includes('thank')) {
      response = "Je vous en prie! N'hésitez pas si vous avez d'autres questions.";
      intent = 'THANK_YOU';
      context = 'closing';
    }
    else if (lowercaseMsg.includes('bonjour') || lowercaseMsg.includes('salut') || lowercaseMsg.includes('hello')) {
      response = "Bonjour! Comment puis-je vous aider aujourd'hui?";
      intent = 'GREETING';
      context = 'welcome';
    }
    else {
      response = "Je ne suis pas sûr de comprendre votre demande. Puis-je vous aider avec votre solde, vos virements, vos cartes ou vos factures?";
      intent = 'FALLBACK';
      context = 'general';
    }
    
    // Simuler un délai de réponse
    return of({
      id: `bot_${Date.now()}`,
      userId: this.userId,
      message: response,
      isBot: true,
      context,
      intent,
      createdAt: new Date()
    }).pipe(delay(1000)); // Délai simulé de 1 seconde
  }
  
  // Obtenir les suggestions rapides basées sur le contexte actuel
  getQuickReplies(): QuickReply[] {
    switch(this.chatState.currentContext) {
      case 'account_balance':
        return [
          { id: 'txn', text: 'Voir transactions récentes', intent: 'SHOW_TRANSACTIONS' },
          { id: 'dl_statement', text: 'Télécharger relevé', intent: 'DOWNLOAD_STATEMENT' }
        ];
      case 'cards':
        return [
          { id: 'card_limit', text: 'Modifier limites carte', intent: 'CARD_LIMIT' },
          { id: 'new_card', text: 'Nouvelle carte', intent: 'NEW_CARD' }
        ];
      case 'bills':
        return [
          { id: 'pay_bills', text: 'Payer factures', intent: 'PAY_BILLS' },
          { id: 'bill_schedule', text: 'Programmer paiement', intent: 'SCHEDULE_PAYMENT' }
        ];
      default:
        return this.defaultQuickReplies;
    }
  }
}