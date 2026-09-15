import type { jsPDF } from 'jspdf'
import type { ProfileData } from '@/store/profile'

/**
 * Render the candidate profile to a real PDF.
 *
 * This draws with jsPDF's text API rather than rasterising the DOM. That
 * matters for two reasons: the output keeps selectable, searchable text (an
 * ATS on the other end has to be able to read it), and a DOM rasteriser
 * would choke on this theme — the palette is authored in `oklch()`, which
 * html2canvas cannot parse and silently renders black.
 *
 * Everything below works in millimetres on A4.
 *
 * jsPDF is imported dynamically: it is ~750 kB, and nobody pays for it until
 * they actually ask for a download. Bundling it eagerly tripled the vendor
 * chunk for a button most visitors never press.
 */

const PAGE = { w: 210, h: 297 }
const M = { top: 18, bottom: 18, left: 18, right: 18 }
const CONTENT_W = PAGE.w - M.left - M.right

/** Ink colours, matched to the on-screen palette but authored in RGB. */
const INK = [17, 24, 39] as const
const INK_2 = [71, 85, 105] as const
const INK_3 = [130, 140, 155] as const
const RULE = [222, 226, 233] as const
const ACCENT = [67, 56, 202] as const // --color-tone-indigo

export interface PdfMeta {
  /** Shown in the footer so a printed copy says where it came from. */
  generatedAt?: Date
  filledFrom?: string | null
}

class Doc {
  doc: jsPDF
  y = M.top
  page = 1

  constructor(doc: jsPDF) {
    this.doc = doc
    this.doc.setFont('helvetica', 'normal')
  }

  /** Reserve vertical space, breaking to a new page when it will not fit. */
  need(mm: number) {
    if (this.y + mm <= PAGE.h - M.bottom) return
    this.doc.addPage()
    this.page += 1
    this.y = M.top
  }

  text(
    str: string,
    opts: {
      size?: number
      style?: 'normal' | 'bold' | 'italic'
      color?: readonly [number, number, number]
      x?: number
      width?: number
      lineGap?: number
    } = {},
  ) {
    const {
      size = 10, style = 'normal', color = INK, x = M.left,
      width = CONTENT_W, lineGap = 1.35,
    } = opts
    this.doc.setFont('helvetica', style)
    this.doc.setFontSize(size)
    this.doc.setTextColor(color[0], color[1], color[2])

    const lines = this.doc.splitTextToSize(str, width) as string[]
    const lineH = (size * 0.3528) * lineGap
    for (const line of lines) {
      this.need(lineH)
      this.doc.text(line, x, this.y + lineH * 0.78)
      this.y += lineH
    }
  }

  gap(mm: number) {
    this.y += mm
  }

  rule() {
    this.need(2)
    this.doc.setDrawColor(RULE[0], RULE[1], RULE[2])
    this.doc.setLineWidth(0.2)
    this.doc.line(M.left, this.y, PAGE.w - M.right, this.y)
    this.y += 2
  }

  /** A section heading with its accent rule. */
  heading(label: string) {
    this.need(12)
    this.gap(3)
    this.doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2])
    this.doc.setLineWidth(0.8)
    this.doc.line(M.left, this.y, M.left + 9, this.y)
    this.y += 3.4
    this.text(label.toUpperCase(), { size: 8.5, style: 'bold', color: ACCENT })
    this.gap(1.6)
  }

  /** A two-column row: label left, value right — used for contact details. */
  labelled(label: string, value: string) {
    const labelW = 30
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(9)
    const lines = this.doc.splitTextToSize(value, CONTENT_W - labelW) as string[]
    const lineH = 9 * 0.3528 * 1.35
    this.need(lineH * lines.length)
    this.doc.setTextColor(INK_3[0], INK_3[1], INK_3[2])
    this.doc.text(label, M.left, this.y + lineH * 0.78)
    this.doc.setTextColor(INK_2[0], INK_2[1], INK_2[2])
    lines.forEach((line, i) => {
      this.doc.text(line, M.left + labelW, this.y + lineH * 0.78 + i * lineH)
    })
    this.y += lineH * lines.length
  }

  /** Skill chips, wrapped across the content width. */
  chips(items: string[]) {
    const size = 9
    const padX = 2.2
    const chipH = 5.4
    const gapX = 2
    const gapY = 2
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(size)

    let x = M.left
    this.need(chipH)
    for (const item of items) {
      const w = this.doc.getTextWidth(item) + padX * 2
      if (x + w > PAGE.w - M.right) {
        x = M.left
        this.y += chipH + gapY
        this.need(chipH)
      }
      this.doc.setFillColor(238, 242, 255) // --color-tone-indigo-bg
      this.doc.roundedRect(x, this.y, w, chipH, 1.2, 1.2, 'F')
      this.doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2])
      this.doc.text(item, x + padX, this.y + chipH * 0.7)
      x += w + gapX
    }
    this.y += chipH
  }

  /** Page numbers, added once every page exists. */
  footers(meta: PdfMeta) {
    const total = this.doc.getNumberOfPages()
    const when = (meta.generatedAt ?? new Date()).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
    for (let p = 1; p <= total; p++) {
      this.doc.setPage(p)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(7.5)
      this.doc.setTextColor(INK_3[0], INK_3[1], INK_3[2])
      this.doc.text(`Generated from Kairo on ${when}`, M.left, PAGE.h - 10)
      this.doc.text(`${p} of ${total}`, PAGE.w - M.right, PAGE.h - 10, { align: 'right' })
    }
  }
}

export async function buildProfilePdf(data: ProfileData, meta: PdfMeta = {}): Promise<jsPDF> {
  const { jsPDF: JsPDF } = await import('jspdf')
  const d = new Doc(new JsPDF({ unit: 'mm', format: 'a4', compress: true }))

  /* ── header ── */
  d.text(data.name, { size: 22, style: 'bold' })
  d.gap(0.5)
  d.text(data.headline, { size: 11.5, color: INK_2 })
  d.gap(2)

  const contact = [data.location, data.email, data.phone].filter(Boolean).join('   ·   ')
  d.text(contact, { size: 9, color: INK_3 })
  d.gap(2.5)
  d.rule()

  /* ── summary ── */
  if (data.summary) {
    d.heading('Professional summary')
    d.text(data.summary, { size: 9.5, color: INK_2 })
  }

  /* ── at a glance ── */
  d.heading('At a glance')
  d.labelled('Experience', `${data.totalExperience} years`)
  d.labelled('Location', data.location)
  if (data.languages.length) d.labelled('Languages', data.languages.join(', '))

  /* ── skills ── */
  if (data.skills.length) {
    d.heading('Skills')
    d.chips(data.skills)
  }

  /* ── experience ── */
  if (data.experience.length) {
    d.heading('Work experience')
    data.experience.forEach((role, i) => {
      if (i > 0) d.gap(2.5)
      // keep a role's title and dates on the same page as its first line
      d.need(16)
      d.text(role.title, { size: 10.5, style: 'bold' })
      d.text(
        `${role.company}   ·   ${role.from} – ${role.to}${role.current ? '  (current)' : ''}`,
        { size: 9, color: INK_3 },
      )
      d.gap(0.8)
      d.text(role.detail, { size: 9.5, color: INK_2 })
    })
  }

  /* ── education ── */
  if (data.education.length) {
    d.heading('Education')
    data.education.forEach((e, i) => {
      if (i > 0) d.gap(2)
      d.need(12)
      d.text(`${e.degree} ${e.field}`, { size: 10.5, style: 'bold' })
      d.text(
        `${e.institution}   ·   ${e.from} – ${e.to}${e.grade ? `   ·   ${e.grade}` : ''}`,
        { size: 9, color: INK_3 },
      )
    })
  }

  /* ── certifications ── */
  if (data.certifications.length) {
    d.heading('Certifications')
    data.certifications.forEach((c) => d.text(`•  ${c}`, { size: 9.5, color: INK_2 }))
  }

  /* ── provenance ── */
  d.gap(4)
  d.rule()
  d.gap(1)
  d.text(
    meta.filledFrom
      ? `Profile fields last filled from “${meta.filledFrom}”. Every value was reviewed by ${data.name} before export.`
      : 'Every value in this document was entered and reviewed by the candidate.',
    { size: 8, color: INK_3, style: 'italic' },
  )

  d.footers(meta)
  return d.doc
}

/** Build the PDF and hand it to the browser as a download. */
export async function downloadProfilePdf(data: ProfileData, meta: PdfMeta = {}) {
  const doc = await buildProfilePdf(data, meta)
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  doc.save(`${slug || 'profile'}-kairo-profile.pdf`)
}
