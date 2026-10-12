package com.web.app.dto;

import lombok.Data;

/**
 * UD05SelectVariableModification レスポンス DTO
 * ModifyDocument 一覧取得結果をフロントエンドに返すための統一レスポンス形式
 */
@Data
public class UD05SelectVariableModificationResponse {

    /**
     * レスポンスコード (200: 成功, 404: 対象データなし)
     */
    private int code;

    /**
     * レスポンスメッセージ
     */
    private String message;

    /**
     * レスポンスデータ（ModifyDocument 一覧）
     */
    private UD05SelectVariableModificationData data;
}
