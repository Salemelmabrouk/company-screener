import { Injectable } from '@angular/core';
import { ChatMessage } from '../models/company.model';

@Injectable({
  providedIn: 'root'
})
export class ChatStorageService {
  
  private getStorageKey(companyId: number): string {
    return `screener_chat_${companyId}`;
  }

  saveHistory(companyId: number, history: ChatMessage[]): void {
    try {
      localStorage.setItem(this.getStorageKey(companyId), JSON.stringify(history));
    } catch {
      // Ignore storage errors
    }
  }

  loadHistory(companyId: number): ChatMessage[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(companyId));
      if (!raw) return [];
      
      const parsed: Array<{ role: string; text: string; timestamp: string; suggestions?: string[] }> = JSON.parse(raw);
      
      return parsed.map(m => ({
        role: m.role as ChatMessage['role'],
        text: m.text,
        timestamp: new Date(m.timestamp),  // Convert ISO string back to Date
        suggestions: m.suggestions
      }));
    } catch {
      return [];
    }
  }

  clearHistory(companyId: number): void {
    try {
      localStorage.removeItem(this.getStorageKey(companyId));
    } catch {
      // Ignore
    }
  }
}
