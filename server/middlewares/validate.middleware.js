/**
 * @file validate.middleware.js
 * @description Middleware factory to validate incoming requests using Zod schemas.
 * Sanitizes and parses req.body, req.query, or req.params before passing control to the controller.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {'body'|'query'|'params'} [target='body'] - The property of req to validate
 * @returns {Function} Express middleware function
 */
export const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[target]);
      // Assign sanitized, typed data back to req object
      req[target] = parsed;
      next();
    } catch (error) {
      // Forward ZodError to centralized error handler
      next(error);
    }
  };
};

export default validate;
