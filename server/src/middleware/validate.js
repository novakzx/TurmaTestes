/** Validação de entrada com Zod — previne SQL injection por dados malformados
 *  (todo o SQL usa parâmetros vinculados) e garante contratos de API estáveis. */

export function validateBody(schema) {
  return (req, res, next) => {
    const r = schema.safeParse(req.body ?? {});
    if (!r.success) {
      return res.status(400).json({
        error: 'Dados inválidos.',
        details: r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    req.valid = r.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const r = schema.safeParse(req.query ?? {});
    if (!r.success) {
      return res.status(400).json({
        error: 'Parâmetros inválidos.',
        details: r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    req.validQuery = r.data;
    next();
  };
}

/** Limpa texto de utilizador: remove controlo/zero-width, colapsa espaços. */
export function cleanText(s, max = 4000) {
  return String(s)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .slice(0, max);
}
