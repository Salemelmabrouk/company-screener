import { Injectable } from '@angular/core';
import { ChatMessage } from '../models/company.model';

@Injectable({
  providedIn: 'root'
})
export class AiFollowUpService {

  readonly defaultSuggestions = [
    'What does this company do?',
    'Who are the main competitors?',
    'What is the business model?',
    'What are the growth prospects?'
  ];

  private readonly pools: Record<string, string[]> = {
    business_model: [
      'Who are the main competitors?',
      'What are the key revenue streams?',
      'What are the growth prospects?',
      'What risks does this company face?',
      'How does it compare to its rivals?'
    ],
    competitors: [
      'What is the business model?',
      'What is the market size for this sector?',
      'What is the competitive advantage?',
      'What are the growth prospects?',
      'Is this company profitable?'
    ],
    growth: [
      'What risks could limit that growth?',
      'How is the company funded?',
      'Who are the main competitors?',
      'What new markets is it targeting?',
      'What does this company do?'
    ],
    risks: [
      'How does it plan to mitigate those risks?',
      'What are the growth prospects?',
      'Who are the main investors?',
      'What is the business model?',
      'Is this company profitable?'
    ],
    funding: [
      'Is this company profitable?',
      'What is the valuation?',
      'Who are the main competitors?',
      'What are the growth prospects?',
      'What is the business model?'
    ],
    leadership: [
      'What is the company culture like?',
      'What are the growth prospects?',
      'How is the company funded?',
      'What is the business model?',
      'Who are the main competitors?'
    ],
    default: [
      'What is the business model?',
      'Who are the main competitors?',
      'What are the growth prospects?',
      'What risks does this company face?',
      'How is the company funded?',
      'Is this company profitable?',
      'What is the company culture like?'
    ]
  };

  generateFollowUps(askedQuestion: string, chatHistory: ChatMessage[]): string[] {
    const q = askedQuestion.toLowerCase();

    let pool: string[];
    if (q.includes('business model') || q.includes('revenue') || q.includes('monetize') || q.includes('make money')) {
      pool = this.pools['business_model'];
    } else if (q.includes('compet') || q.includes('rival') || q.includes('alternative')) {
      pool = this.pools['competitors'];
    } else if (q.includes('growth') || q.includes('future') || q.includes('prospect') || q.includes('expand')) {
      pool = this.pools['growth'];
    } else if (q.includes('risk') || q.includes('challenge') || q.includes('problem') || q.includes('threat')) {
      pool = this.pools['risks'];
    } else if (q.includes('fund') || q.includes('invest') || q.includes('valuat') || q.includes('ipo')) {
      pool = this.pools['funding'];
    } else if (q.includes('ceo') || q.includes('founder') || q.includes('leader') || q.includes('team') || q.includes('culture')) {
      pool = this.pools['leadership'];
    } else {
      pool = this.pools['default'];
    }

    // Filter out any suggestions that the user has already asked at any point in the conversation
    const userQuestions = chatHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.text.toLowerCase());

    const filtered = pool.filter(s => !userQuestions.includes(s.toLowerCase()));

    // If the specific pool is exhausted, pull fresh ones from the default pool
    let finalSuggestions = filtered.slice(0, 3);
    if (finalSuggestions.length < 3) {
      const defaultPoolFiltered = this.pools['default']
        .filter(s => !userQuestions.includes(s.toLowerCase()) && !finalSuggestions.includes(s));
      finalSuggestions = [...finalSuggestions, ...defaultPoolFiltered].slice(0, 3);
    }

    return finalSuggestions;
  }
}
