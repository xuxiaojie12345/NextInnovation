/**
 * 前端日志工具
 * - 控制台输出（info / warn / error）
 * - 通过 POST /api/front-log 上报到后端，由后端写入日志文件（logs/error.log 等）
 */
export type LogLevel = 'info' | 'warn' | 'error';

interface FrontLogPayload {
  level: LogLevel;
  message: string;
  stack?: string;
  url?: string;
  user_agent?: string;
  trace_id?: string;
}

const REPORT_URL = '/api/front-log';

/** 上报节流：同一条消息 1 秒内只上报一次，避免循环报错刷爆后端 */
const recentReports = new Map<string, number>();
const REPORT_THROTTLE_MS = 1000;

/** 会话级 trace_id，便于把同一次浏览器会话的日志串起来 */
let sessionTraceId = '';
function getSessionTraceId(): string {
  if (!sessionTraceId) {
    sessionTraceId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
  return sessionTraceId;
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function report(payload: FrontLogPayload): void {
  const { message } = payload;
  const now = Date.now();
  const last = recentReports.get(message);
  if (last !== undefined && now - last < REPORT_THROTTLE_MS) return;
  recentReports.set(message, now);

  const body = JSON.stringify({ ...payload, trace_id: getSessionTraceId() });
  try {
    // sendBeacon 在页面卸载时也能发出；失败时回退到 fetch（keepalive）
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(REPORT_URL, blob)) return;
    }
    fetch(REPORT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // 上报失败静默处理，避免日志上报自身抛错形成死循环
    });
  } catch {
    // ignore
  }
}

export const logger = {
  info(message: string, context?: unknown): void {
    console.info(`[info] ${message}`, context ?? '');
    report({
      level: 'info',
      message:
        context === undefined ? message : `${message} ${stringify(context)}`,
    });
  },
  warn(message: string, context?: unknown): void {
    console.warn(`[warn] ${message}`, context ?? '');
    report({
      level: 'warn',
      message:
        context === undefined ? message : `${message} ${stringify(context)}`,
    });
  },
  error(message: string, error?: unknown): void {
    console.error(`[error] ${message}`, error ?? '');
    const err = error instanceof Error ? error : undefined;
    report({
      level: 'error',
      message,
      stack: err?.stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    });
  },
};

/** 注册全局异常捕获（未捕获异常 / Promise 拒绝） */
export function installGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    logger.error(
      `uncaught error: ${event.message} (${event.filename}:${event.lineno}:${event.colno})`,
      event.error,
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    logger.error(
      `unhandled promise rejection: ${stringify(reason)}`,
      reason instanceof Error ? reason : undefined,
    );
  });
}
