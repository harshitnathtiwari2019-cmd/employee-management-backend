import type {
  ErrorRequestHandler,
  Request,
  Response,
  NextFunction,
} from "express";
import multer from "multer";
import { AppError } from "../errors/AppError.js";

export class ErrorMiddleware {
  public readonly handle: ErrorRequestHandler = (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    // Handle Multer upload errors first.
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          success: false,
          message: "File is too large. Maximum allowed size is 2 MB.",
        });
        return;
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        res.status(400).json({
          success: false,
          message: "Only one file can be uploaded at a time.",
        });
        return;
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        res.status(400).json({
          success: false,
          message: "Unexpected file field. Use profilePhoto.",
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: "File upload failed.",
      });
      return;
    }

    // Handle known application errors.
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    // Log unexpected errors on the server.
    console.error("Unexpected error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  };
}
