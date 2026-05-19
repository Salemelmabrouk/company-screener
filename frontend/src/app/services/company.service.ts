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
  SectorCount,
  ChatMessage,
} from "../models/company.model";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/companies`;

  // Cache sectors for the lifetime of the service instance
  private sectorsRequest$?: Observable<string[]>;
  // Cache sector distribution for the chart
  private sectorDistRequest$?: Observable<SectorCount[]>;

  /** Paginated list — main list view */
  getAllCompanies(
    page: number,
    size: number,
    search = "",
    sector = ""
  ): Observable<PageResponse<CompanyListItem>> {
    let params = new HttpParams().set("page", page).set("size", size);
    if (search.trim()) params = params.set("search", search.trim());
    if (sector.trim()) params = params.set("sector", sector.trim());
    return this.http.get<PageResponse<CompanyListItem>>(this.apiUrl, { params });
  }

  /** Full unpaginated list — for watchlist and sector chart */
  getAllCompaniesUnpaged(): Observable<CompanyListItem[]> {
    return this.http.get<CompanyListItem[]>(`${this.apiUrl}/all`);
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

  getSectorDistribution(): Observable<SectorCount[]> {
    this.sectorDistRequest$ ??= this.http
      .get<SectorCount[]>(`${this.apiUrl}/sector-distribution`)
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    return this.sectorDistRequest$;
  }

  askQuestion(
    companyId: number,
    question: string,
    history?: ChatMessage[]
  ): Observable<AiAnswerResponse> {
    const mappedHistory = history
      ? history
          .filter((m) => m.role !== "error")
          .map((m) => ({ role: m.role, content: m.text }))
      : [];

    const body: AiQuestionRequest = { question, history: mappedHistory };
    return this.http.post<AiAnswerResponse>(`${this.apiUrl}/${companyId}/ask`, body);
  }
}
