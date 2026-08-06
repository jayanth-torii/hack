export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = "ApiError";
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(401, message);
  }
  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(403, message);
  }
  static notFound(message = "Not found"): ApiError {
    return new ApiError(404, message);
  }
  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }
  static unprocessable(message: string, details?: unknown): ApiError {
    return new ApiError(422, message, details);
  }
}
