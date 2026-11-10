import { isApiError } from "./ApiError";
import { t } from "../constants/messages";

/**
 * ApiError を表示用メッセージに変換する共通ヘルパー。
 * バックエンドから返る business code を message id として t() で翻訳する。
 * code が無い（通信異常等）場合は ApiError/Error の message、それも無ければ fallback を使う。
 */
export function apiErrorMessage(e: unknown, fallback = ""): string {
  if (isApiError(e) && e.message) {
    return t(e.message, e.params ?? []);
  }
  return e instanceof Error && e.message ? e.message : fallback;
}
