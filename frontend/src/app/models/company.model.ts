export interface Company {
  id: number;
  name: string;
  sector: string;
  country: string;
  description: string;
  foundedYear: number;
  employeeCount: number;
}

export interface AiQuestionRequest {
  question: string;
}

export interface AiAnswerResponse {
  answer: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
