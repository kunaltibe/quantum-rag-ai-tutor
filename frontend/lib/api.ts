import axios, { AxiosError } from "axios"

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ""

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

export interface Publication {
  id?: string | number
  name?: string
  title?: string
  filename?: string
  [key: string]: unknown
}

export interface RelatedPaper {
  title: string
  url?: string
  link?: string
}

export interface QAResponse {
  answer: string
  related_papers?: RelatedPaper[]
  [key: string]: unknown
}

export interface SummaryResponse {
  overview?: string
  key_concepts?: string | string[]
  important_details?: string | string[]
  main_takeaways?: string | string[]
  summary?: string
  [key: string]: unknown
}

export async function fetchPublications(): Promise<Publication[]> {
  const res = await api.get<Publication[] | { publications: Publication[] }>(
    "/publications/",
  )
  const data = res.data
  if (Array.isArray(data)) return data
  if (data && Array.isArray((data as { publications: Publication[] }).publications)) {
    return (data as { publications: Publication[] }).publications
  }
  return []
}

export async function askQuestion(query: string, contextId: string): Promise<QAResponse> {
  const res = await api.post<QAResponse>("/qa-pdf/", {
    query,
    context_id: contextId,
  })
  return res.data
}

export async function summarizeStored(
  documentName: string,
  topic: string,
): Promise<SummaryResponse> {
  const res = await api.post<SummaryResponse>("/summarize-pdf/", {
    document_name: documentName,
    topic,
  })
  return res.data
}

export async function summarizeUpload(
  file: File,
  topic: string,
): Promise<SummaryResponse> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("topic", topic)
  const res = await api.post<SummaryResponse>("/summarize-pdf/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axErr = error as AxiosError<{ message?: string; detail?: string }>
    if (!BASE_URL) {
      return "Backend URL not configured. Set NEXT_PUBLIC_BACKEND_URL."
    }
    if (axErr.response?.data) {
      const data = axErr.response.data
      if (typeof data === "string") return data
      if (data.message) return data.message
      if (data.detail) return data.detail
    }
    if (axErr.code === "ERR_NETWORK") {
      return "Network error — could not reach the backend."
    }
    return axErr.message || "Request failed."
  }
  if (error instanceof Error) return error.message
  return "Something went wrong."
}
