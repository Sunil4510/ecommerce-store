import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * A generic middleware wrapper that validates the request body against a given Zod schema.
 * Replaces req.body with the safely parsed and typed output.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation Error',
        messages: result.error.issues.map(issue => issue.message),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
