import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { shareReplay } from "rxjs/operators";
import {
  Company,
  CompanyListItem,
  AiQuestionRequest,
  AiAnswerResponse,
  PageResponse,
  ChatMessage
} from "../models/company.model";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/companies`;
  private sectorsRequest$?: Observable<string[]>;

  getAllCompanies(
    page: number,
    size: number,
    search = "",
    sector = "",
  ): Observable<PageResponse<CompanyListItem>> {
    let params = new HttpParams()
      .set("page", page)
      .set("size", size);

    const trimmedSearch = search.trim();
    const trimmedSector = sector.trim();

    if (trimmedSearch) {
      params = params.set("search", trimmedSearch);
    }

    if (trimmedSector) {
      params = params.set("sector", trimmedSector);
    }

    return this.http.get<PageResponse<CompanyListItem>>(this.apiUrl, { params });
  }

  getCompanyById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/${id}`);
  }

  getSectors(): Observable<string[]> {
    this.sectorsRequest$ ??= this.http
      .get<string[]>(`${this.apiUrl}/sectors`)
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));

    return this.sectorsRequest$;
  }

  askQuestion(
    companyId: number,
    question: string,
    history?: ChatMessage[]
  ): Observable<AiAnswerResponse> {
    // Map ChatMessage[] to backend DTO format (role, content)
    // Filter out errors and suggestions
    const mappedHistory = history
      ? history
          .filter((m) => m.role !== 'error')
          .map((m) => ({
            role: m.role,
            content: m.text,
          }))
      : [];

    const body: AiQuestionRequest = {
      question,
      history: mappedHistory,
    };

    return this.http.post<AiAnswerResponse>(
      `${this.apiUrl}/${companyId}/ask`,
      body,
    );
  }
}
