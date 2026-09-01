import Papa from 'papaparse'
import { PR_MUNICIPALITIES, isValidPrZip } from '@/lib/puertoRico'
import type { Customer, CustomerType } from '@/types/domain'

// The canonical column set for both directions — export writes exactly
// these headers, and import matches against them case-insensitively, so a
// file exported from this app always re-imports cleanly.
export const CUSTOMER_CSV_COLUMNS = [
  'name',
  'type',
  'address',
  'municipality',
  'zip',
  'contact_name',
  'contact_phone',
  'contact_email',
  'requires_signature',
  'handles_controlled_substances',
  'delivery_notes',
  'active',
] as const

const CUSTOMER_TYPES: CustomerType[] = ['pharmacy', 'clinic', 'hospital', 'nursing_home', 'patient']

function toCsvBool(v: boolean) {
  return v ? 'true' : 'false'
}

export function customersToCsv(customers: Customer[]): string {
  const rows = customers.map((c) => ({
    name: c.name,
    type: c.type,
    address: c.address,
    municipality: c.city,
    zip: c.zip,
    contact_name: c.contactName ?? '',
    contact_phone: c.contactPhone ?? '',
    contact_email: c.contactEmail ?? '',
    requires_signature: toCsvBool(c.requiresSignature),
    handles_controlled_substances: toCsvBool(c.handlesControlledSubstances),
    delivery_notes: c.deliveryNotes ?? '',
    active: toCsvBool(c.active),
  }))
  return Papa.unparse({ fields: [...CUSTOMER_CSV_COLUMNS], data: rows })
}

export function customerCsvTemplate(): string {
  return Papa.unparse({
    fields: [...CUSTOMER_CSV_COLUMNS],
    data: [
      {
        name: 'Farmacia Ejemplo',
        type: 'pharmacy',
        address: '123 Calle Luna',
        municipality: 'San Juan',
        zip: '00926',
        contact_name: 'Jane Doe',
        contact_phone: '787-555-0100',
        contact_email: 'contact@example.com',
        requires_signature: 'true',
        handles_controlled_substances: 'false',
        delivery_notes: '',
        active: 'true',
      },
    ],
  })
}

export function downloadCsv(filename: string, content: string) {
  // A leading BOM so Excel (still the most common opener for a CSV like
  // this) detects UTF-8 instead of mangling accented municipio names.
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function parseBool(v: unknown, fallback = false): boolean {
  if (typeof v !== 'string') return fallback
  const s = v.trim().toLowerCase()
  if (['true', '1', 'yes', 'y', 'sí', 'si'].includes(s)) return true
  if (['false', '0', 'no', 'n'].includes(s)) return false
  return fallback
}

// Case-insensitive header lookup — a hand-edited CSV won't always match
// our exact casing/underscore convention.
function normalizeKey(k: string) {
  return k.trim().toLowerCase().replace(/\s+/g, '_')
}

export interface ParsedCustomerRow {
  name: string
  type: CustomerType
  address: string
  city: string
  state: string
  zip: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  requiresSignature: boolean
  handlesControlledSubstances: boolean
  deliveryNotes?: string
  active: boolean
}

export interface CustomerCsvError {
  row: number
  message: string
}

export interface ParsedCustomersCsv {
  rows: ParsedCustomerRow[]
  errors: CustomerCsvError[]
}

export function parseCustomersCsv(text: string): ParsedCustomersCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeKey,
  })

  const rows: ParsedCustomerRow[] = []
  const errors: CustomerCsvError[] = []

  result.data.forEach((raw, i) => {
    // +2: 1 for the header row, 1 to make it 1-indexed like a spreadsheet.
    const rowNum = i + 2
    const name = (raw.name ?? '').trim()
    const address = (raw.address ?? '').trim()
    const municipality = (raw.municipality ?? raw.city ?? '').trim()
    const zip = (raw.zip ?? raw.zip_code ?? '').trim()

    if (!name) return errors.push({ row: rowNum, message: 'Missing name' })
    if (!address) return errors.push({ row: rowNum, message: 'Missing address' })
    if (!(PR_MUNICIPALITIES as readonly string[]).some((m) => m.toLowerCase() === municipality.toLowerCase())) {
      return errors.push({ row: rowNum, message: `Unknown municipality "${municipality}"` })
    }
    if (!isValidPrZip(zip)) {
      return errors.push({ row: rowNum, message: `Invalid PR zip "${zip}"` })
    }

    const typeRaw = (raw.type ?? '').trim().toLowerCase().replace(/\s+/g, '_') as CustomerType
    const type = CUSTOMER_TYPES.includes(typeRaw) ? typeRaw : 'pharmacy'
    const properMunicipality = PR_MUNICIPALITIES.find((m) => m.toLowerCase() === municipality.toLowerCase())!

    rows.push({
      name,
      type,
      address,
      city: properMunicipality,
      state: 'PR',
      zip,
      contactName: raw.contact_name?.trim() || undefined,
      contactPhone: raw.contact_phone?.trim() || undefined,
      contactEmail: raw.contact_email?.trim() || undefined,
      requiresSignature: parseBool(raw.requires_signature),
      handlesControlledSubstances: parseBool(raw.handles_controlled_substances),
      deliveryNotes: raw.delivery_notes?.trim() || undefined,
      active: parseBool(raw.active, true),
    })
  })

  return { rows, errors }
}
