import { z } from 'zod';

const MIN_CUSTOMER_SINCE = 1900;

// Los <input type="number"> entregan strings; uno vacío significa "sin dato"
// (con z.coerce.number() se convertía en 0 y pasaba como valor válido).
const optionalNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number({ error: 'Debe ser un número' }).optional(),
);

export const createPolicySchema = z
  .object({
    customerId: z.string().min(1, 'Seleccione un cliente'),
    branch: z.enum(['AUTO', 'LIFE', 'HOME', 'HEALTH', 'TRAVEL']),
    ratingStrategy: z.enum(['STANDARD', 'RISK_BASED', 'LOYALTY']),
    riskScore: optionalNumber,
    customerSince: optionalNumber,
  })
  // Cada estrategia valida solo su propio dato: un valor que quedó en un campo
  // oculto de otra estrategia no debe bloquear el envío.
  .superRefine((data, ctx) => {
    if (data.ratingStrategy === 'RISK_BASED') {
      if (data.riskScore === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['riskScore'],
          message: 'Risk Score es requerido para la estrategia RISK_BASED',
        });
      } else if (data.riskScore < 0 || data.riskScore > 100) {
        ctx.addIssue({
          code: 'custom',
          path: ['riskScore'],
          message: 'Risk Score debe estar entre 0 y 100',
        });
      }
    }

    if (data.ratingStrategy === 'LOYALTY') {
      const currentYear = new Date().getFullYear();
      if (data.customerSince === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['customerSince'],
          message: 'Año de ingreso es requerido para la estrategia LOYALTY',
        });
      } else if (data.customerSince < MIN_CUSTOMER_SINCE || data.customerSince > currentYear) {
        ctx.addIssue({
          code: 'custom',
          path: ['customerSince'],
          message: `El año debe estar entre ${MIN_CUSTOMER_SINCE} y ${currentYear}`,
        });
      }
    }
  });

// El formulario trabaja con el tipo de entrada (valores crudos de los inputs)
// y el submit recibe el de salida (números ya convertidos).
export type CreatePolicyFormInput = z.input<typeof createPolicySchema>;
export type CreatePolicyFormData = z.output<typeof createPolicySchema>;
