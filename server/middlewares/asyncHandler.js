/**
 * @file asyncHandler.js
 * @description Higher-Order Function that wraps asynchronous Express route handlers
 * and forwards any thrown errors or rejected promises directly to the next() error handler.
 * Eliminates repetitive, error-prone try/catch blocks across all controllers.
 *
 * @param {Function} requestHandler - Asynchronous Express route handler (req, res, next)
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;
