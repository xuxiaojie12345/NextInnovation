package com.web.app.dto;

import lombok.Data;

/**
 * UD05SelectVariableModification リクエスト DTO
 * ModifyDocument 画面から送信される検索条件を封装する
 */
@Data
public class UD05SelectVariableModificationRequest {

    /**
     * シャーシシリーズ
     */
    private String chassisSeries;

    /**
     * シャーシNo
     */
    private String chassisNo;
}
