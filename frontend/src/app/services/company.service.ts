import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  Company,
  AiQuestionRequest,
  AiAnswerResponse,
  PageResponse,
} from "../models/company.model";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/companies`;

  getAllCompanies(
    page: number,
    size: number,
  ): Observable<PageResponse<Company>> {
    return this.http.get<PageResponse<Company>>(
      `${this.apiUrl}?page=${page}&size=${size}`,
    );
  }

  getCompanyById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/${id}`);
  }

  askQuestion(
    companyId: number,
    question: string,
  ): Observable<AiAnswerResponse> {
    const body: AiQuestionRequest = { question };
    return this.http.post<AiAnswerResponse>(
      `${this.apiUrl}/${companyId}/ask`,
      body,
    );
  }
}
