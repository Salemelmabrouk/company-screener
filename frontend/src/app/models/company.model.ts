export interface CompanySummary {
  id: number;
  name: string;
  sector: string;
  country: string;
  foundedYear: number;
  employeeCount: number;
}

export interface CompanyListItem extends CompanySummary {
  descriptionPreview: string;
}

export interface Company extends CompanySummary {
  description: string;
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
  first: boolean;
  last: boolean;
}
