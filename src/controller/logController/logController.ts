import { Request, Response } from "express";
import logger, { getRecentLogs, clearStoredLogs } from "../../utils/logger";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/responseFun";

/**
 * GET /api/admin/logs
 * Retrieve recent Pino logs and summary metrics
 */
export const getLogs = async (req: Request, res: Response): Promise<Response> => {
  try {
    const allLogs = getRecentLogs();

    const levelFilter = typeof req.query.level === "string" ? req.query.level.toLowerCase() : "all";
    const typeFilter = typeof req.query.type === "string" ? req.query.type.toLowerCase() : "all";
    const search = typeof req.query.search === "string" ? req.query.search.toLowerCase().trim() : "";
    const limit = Math.min(Math.max(Number(req.query.limit) || 250, 1), 1000);

    let infoCount = 0;
    let warnCount = 0;
    let errorCount = 0;
    let debugCount = 0;
    let httpCount = 0;
    let totalResponseTime = 0;
    let responseTimeSamples = 0;

    for (const entry of allLogs) {
      if (entry.levelLabel === "error" || entry.levelLabel === "fatal") errorCount++;
      else if (entry.levelLabel === "warn") warnCount++;
      else if (entry.levelLabel === "info") infoCount++;
      else debugCount++;

      if (entry.type === "http") {
        httpCount++;
        if (typeof entry.responseTime === "number") {
          totalResponseTime += entry.responseTime;
          responseTimeSamples++;
        }
      }
    }

    const filtered = allLogs.filter((entry) => {
      if (levelFilter !== "all") {
        if (levelFilter === "error" && entry.levelLabel !== "error" && entry.levelLabel !== "fatal") {
          return false;
        } else if (levelFilter !== "error" && entry.levelLabel !== levelFilter) {
          return false;
        }
      }
      if (typeFilter !== "all" && entry.type !== typeFilter) {
        return false;
      }
      if (search) {
        const msgMatch = entry.msg?.toLowerCase().includes(search);
        const urlMatch = entry.req?.url?.toLowerCase().includes(search);
        const methodMatch = entry.req?.method?.toLowerCase().includes(search);
        const statusMatch = String(entry.res?.statusCode || "").includes(search);
        const errMatch = JSON.stringify(entry.err || "").toLowerCase().includes(search);
        if (!msgMatch && !urlMatch && !methodMatch && !statusMatch && !errMatch) {
          return false;
        }
      }
      return true;
    });

    const avgResponseTime =
      responseTimeSamples > 0 ? Math.round((totalResponseTime / responseTimeSamples) * 10) / 10 : 0;

    return sendSuccessResponse(
      res,
      {
        stats: {
          total: allLogs.length,
          info: infoCount,
          warn: warnCount,
          error: errorCount,
          debug: debugCount,
          httpRequests: httpCount,
          avgResponseTimeMs: avgResponseTime,
          uptime: Math.floor(process.uptime()),
          currentLevel: logger.level,
        },
        logs: filtered.slice(0, limit),
      },
      "System logs fetched successfully"
    );
  } catch (error: any) {
    logger.error({ err: error?.message || error }, "getLogs error");
    return sendErrorResponse(res, 500, "Failed to retrieve system logs");
  }
};

/**
 * POST /api/admin/logs/clear
 * Clear all stored Pino logs
 */
export const clearLogs = async (_req: Request, res: Response): Promise<Response> => {
  try {
    clearStoredLogs();
    logger.info("System logs cleared by administrator");
    return sendSuccessResponse(res, { cleared: true }, "All system logs cleared successfully");
  } catch (error: any) {
    logger.error({ err: error?.message || error }, "clearLogs error");
    return sendErrorResponse(res, 500, "Failed to clear system logs");
  }
};

/**
 * POST /api/admin/logs/test
 * Emit a sample log entry for testing the Admin Log Viewer
 */
export const emitTestLog = async (req: Request, res: Response): Promise<Response> => {
  try {
    const level = (req.body?.level || "info").toLowerCase();
    const message = req.body?.message || "Test diagnostic log triggered from Admin Portal";

    if (level === "error") {
      logger.error({ source: "AdminLogViewer", diagnostic: true }, message);
    } else if (level === "warn") {
      logger.warn({ source: "AdminLogViewer", diagnostic: true }, message);
    } else {
      logger.info({ source: "AdminLogViewer", diagnostic: true }, message);
    }

    return sendSuccessResponse(res, { emitted: true, level }, `Test ${level.toUpperCase()} log recorded`);
  } catch (error: any) {
    logger.error({ err: error?.message || error }, "emitTestLog error");
    return sendErrorResponse(res, 500, "Failed to emit test log");
  }
};

