import { describe, expect, it } from 'vitest';
import { createPolicySchema } from './createPolicy.schema';

const CURRENT_YEAR = new Date().getFullYear();

// Valores tal como los entrega el formulario: los <input type="number">
// llegan como string ('' si están vacíos).
const base = {
  customerId: '6f1c2b8e-1d2a-4c3b-9e4f-5a6b7c8d9e0f',
  branch: 'AUTO',
  ratingStrategy: 'STANDARD',
};

const errorsOf = (input: Record<string, unknown>) => {
  const result = createPolicySchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('createPolicySchema (validación del formulario de pólizas)', () => {
  it('acepta una póliza STANDARD sin datos de riesgo', () => {
    expect(createPolicySchema.parse(base)).toEqual(base);
  });

  it('exige seleccionar un cliente', () => {
    expect(errorsOf({ ...base, customerId: '' })).toEqual({
      customerId: 'Seleccione un cliente',
    });
  });

  it.each([['branch', 'MARINE'], ['ratingStrategy', 'PROMO']])(
    'rechaza un %s fuera del catálogo',
    (field, value) => {
      expect(errorsOf({ ...base, [field]: value })).toHaveProperty(field);
    },
  );

  describe('RISK_BASED', () => {
    const riskBased = { ...base, ratingStrategy: 'RISK_BASED' };

    it.each([['0', 0], ['40', 40], ['100', 100]])(
      'convierte riskScore "%s" a número',
      (raw, expected) => {
        expect(createPolicySchema.parse({ ...riskBased, riskScore: raw }).riskScore).toBe(expected);
      },
    );

    it.each([undefined, ''])('exige riskScore (valor %j)', (riskScore) => {
      expect(errorsOf({ ...riskBased, riskScore })).toEqual({
        riskScore: 'Risk Score es requerido para la estrategia RISK_BASED',
      });
    });

    it.each(['-1', '101'])('rechaza riskScore %s fuera de 0–100', (riskScore) => {
      expect(errorsOf({ ...riskBased, riskScore })).toEqual({
        riskScore: 'Risk Score debe estar entre 0 y 100',
      });
    });

    it('rechaza un riskScore que no es número', () => {
      expect(errorsOf({ ...riskBased, riskScore: 'abc' })).toHaveProperty('riskScore');
    });
  });

  describe('LOYALTY', () => {
    const loyalty = { ...base, ratingStrategy: 'LOYALTY' };

    it('acepta el año de ingreso y lo convierte a número', () => {
      expect(createPolicySchema.parse({ ...loyalty, customerSince: '2020' }).customerSince).toBe(2020);
    });

    it.each([undefined, ''])('exige el año de ingreso (valor %j)', (customerSince) => {
      expect(errorsOf({ ...loyalty, customerSince })).toEqual({
        customerSince: 'Año de ingreso es requerido para la estrategia LOYALTY',
      });
    });

    it.each(['1899', String(CURRENT_YEAR + 1)])('rechaza el año %s', (customerSince) => {
      expect(errorsOf({ ...loyalty, customerSince })).toEqual({
        customerSince: `El año debe estar entre 1900 y ${CURRENT_YEAR}`,
      });
    });
  });

  it('un campo numérico vacío de otra estrategia no bloquea el envío', () => {
    expect(errorsOf({ ...base, riskScore: '', customerSince: '' })).toEqual({});
  });

  it('un valor fuera de rango en el campo oculto de otra estrategia no bloquea el envío', () => {
    expect(errorsOf({ ...base, ratingStrategy: 'LOYALTY', riskScore: '150', customerSince: '2020' })).toEqual({});
  });
});
