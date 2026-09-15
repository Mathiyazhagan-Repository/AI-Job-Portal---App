import * as pdfjsLib from 'pdfjs-dist'
import * as mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export interface ParsedResumeData {
  name?: string
  email?: string
  phone?: string
  location?: string
  skills: string[]
  experienceYears?: number
  summary?: string
  rawText: string
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function extractEmail(text: string) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match?.[0]
}

function extractPhone(text: string) {
  const match = text.match(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/)
  return match?.[0]
}

function extractName(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)

  for (const line of lines) {
    if (line.length < 3 || line.length > 80) continue
    if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(line)) return line
  }

  return undefined
}

function extractLocation(text: string) {
  const patterns = ['Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Delhi', 'Mumbai', 'Kolkata']
  return patterns.find((city) => text.toLowerCase().includes(city.toLowerCase()))
}

function extractSkills(text: string) {
  const known = [
    'react', 'typescript', 'javascript', 'node', 'node.js', 'python', 'java', 'sql', 'postgresql',
    'css', 'tailwind', 'html', 'aws', 'docker', 'kubernetes', 'figma', 'graphql', 'next.js', 'mongodb',
    'redux', 'jest', 'cypress', 'firebase', 'azure'
  ]

  const found = new Set<string>()
  const lower = text.toLowerCase()
  for (const skill of known) {
    if (lower.includes(skill)) found.add(skill)
  }

  return Array.from(found).map((skill) => skill.replace(/\./g, '.'))
}

function extractExperienceYears(text: string) {
  const match = text.match(/(\d+)\s*(?:years?|yrs?)/i)
  if (!match) return undefined
  const value = Number(match[1])
  return Number.isFinite(value) ? value : undefined
}

async function parsePdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
  const pdf = await loadingTask.promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = (content.items as Array<{ str?: string }>)
      .map((item) => item?.str ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (text) pages.push(text)
  }

  return pages.join('\n')
}

async function parseDocxText(file: File): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return result.value
}

export async function parseResumeFile(file: File): Promise<ParsedResumeData> {
  const type = file.type.toLowerCase()
  const lowerName = file.name.toLowerCase()

  let rawText = ''
  if (type.includes('pdf') || lowerName.endsWith('.pdf')) {
    rawText = await parsePdfText(file)
  } else if (type.includes('word') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
    rawText = await parseDocxText(file)
  } else if (lowerName.endsWith('.txt')) {
    rawText = await file.text()
  } else {
    rawText = await file.text()
  }

  const normalized = normalizeWhitespace(rawText)

  return {
    name: extractName(normalized) ?? undefined,
    email: extractEmail(normalized) ?? undefined,
    phone: extractPhone(normalized) ?? undefined,
    location: extractLocation(normalized) ?? undefined,
    skills: extractSkills(normalized),
    experienceYears: extractExperienceYears(normalized),
    summary: normalized.slice(0, 400),
    rawText: normalized,
  }
}
