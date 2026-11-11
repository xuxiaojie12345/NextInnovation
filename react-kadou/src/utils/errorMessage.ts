import { isApiError } from "./ApiError";
import { t } from "../constants/messages";

/**
 * ApiError を表示用メッセージに変換する共通ヘルパー。
 * バックエンドが返す業務コード（message id）を t() で翻訳する。
 * 業務コードが無い（通信異常・システムエラー等）場合は ApiError/Error の message、
 * それも無ければ fallback を使う。
 */
export function apiErrorMessage(e: unknown, fallback = ""): string {
  if (isApiError(e) && e.messageId) {
    return t(e.messageId, e.params ?? []);
  }
  return e instanceof Error && e.message ? e.message : fallback;
}