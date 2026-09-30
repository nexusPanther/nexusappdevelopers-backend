import { Response } from "express";

export const sendErrorResponse = (res: Response, statusCode: number, message: string) => {
  return res.status(statusCode).json({
    success: false,
    status: false,
    message,
  });
};

export const sendSuccessResponse = (res: Response, data: any, message: string, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    status: true,
    data,
    message,
  });
};

export const sendSuccessWithoutResponse = (res: Response, message: string, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    status: true,
    message,
  });
};

  
  