package com.web.app.dto;

import lombok.Data;

/**
 * UD04SelectGeneratedocument レスポンス DTO
 * Chassis 関連データ取得結果をフロントエンドに返すための統一レスポンス形式
 */
@Data
public class UD04SelectGeneratedocumentResponse {

    /**
     * レスポンスコード (200: 成功)
     */
    private int code;

    /**
     * レスポンスメッセージ
     */
    private String message;

    /**
     * レスポンスデータ（Chassis 関連データ）
     */
    private UD04SelectGeneratedocumentData data;
}
