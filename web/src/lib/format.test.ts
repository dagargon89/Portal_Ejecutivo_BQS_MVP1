import { describe, expect, it } from 'vitest'
import { formatEntero, formatMoneda } from './format'

describe('formatMoneda', () => {
  it('formatea el saldo del Caso QA 4 como $30,000.00', () => {
    expect(formatMoneda(30000)).toBe('$30,000.00')
  })

  it('formatea los strings DECIMAL que entrega el backend', () => {
    expect(formatMoneda('100000.00')).toBe('$100,000.00')
    expect(formatMoneda('10000.00')).toBe('$10,000.00')
  })

  it('devuelve "—" para vacío, nulo o no numérico', () => {
    expect(formatMoneda('')).toBe('—')
    expect(formatMoneda(null)).toBe('—')
    expect(formatMoneda(undefined)).toBe('—')
    expect(formatMoneda('N/A')).toBe('—')
  })
})

describe('formatEntero', () => {
  it('formatea piezas con separador de miles', () => {
    expect(formatEntero(120000)).toBe('120,000')
  })

  it('devuelve "—" para vacío o no numérico', () => {
    expect(formatEntero('')).toBe('—')
    expect(formatEntero(null)).toBe('—')
  })
})
