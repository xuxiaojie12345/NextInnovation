package com.web.app.dto;

import lombok.Data;

/**
 * UD04SelectGeneratedocument リクエスト DTO
 * GenerateDocument 画面から送信される検索条件を封装する
 */
@Data
public class UD04SelectGeneratedocumentRequest {

    /**
     * シャーシシリーズ
     */
    private String chassisSeries;

    /**
     * シャーシNo
     */
    private String chassisNo;
}
