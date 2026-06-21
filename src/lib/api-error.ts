import { NextResponse } from "next/server";

export interface ApiErrorOptions {
  status?: number;
  code?: string;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.status = options.status || 500;
    this.code = options.code || "INTERNAL_SERVER_ERROR";
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.status }
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        error: "Invalid JSON in request body",
        code: "INVALID_JSON",
      },
      { status: 400 }
    );
  }

  // Default error response
  return NextResponse.json(
    {
      error: "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR",
    },
    { status: 500 }
  );
}

export function badRequest(message: string, code = "BAD_REQUEST"): ApiError {
  return new ApiError(message, { status: 400, code });
}

export function unauthorized(message = "Unauthorized", code = "UNAUTHORIZED"): ApiError {
  return new ApiError(message, { status: 401, code });
}

export function forbidden(message = "Forbidden", code = "FORBIDDEN"): ApiError {
  return new ApiError(message, { status: 403, code });
}

export function notFound(message = "Not found", code = "NOT_FOUND"): ApiError {
  return new ApiError(message, { status: 404, code });
}

export function conflict(message = "Conflict", code = "CONFLICT"): ApiError {
  return new ApiError(message, { status: 409, code });
}
