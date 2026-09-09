package com.web.app.dto;

import lombok.Data;

/**
 * UD04SelectGeneratedocument データ DTO
 * Chassis 関連データの取得結果を保持する
 */
@Data
public class UD04SelectGeneratedocumentData {

    /**
     * オーダー番号
     */
    private String ordernumber;

    /**
     * ビルド
     */
    private String build;

    /**
     * スペック
     */
    private String spec;

    /**
     * カスタマー適用
     */
    private String custrAdap;

    /**
     * 運用国
     */
    private String countryOfOperation;

    /**
     * ロードインデックス
     */
    private String loadIndex;

    /**
     * ACT
     */
    private String act;

    /**
     * 変数
     */
    private String variable;
}
