package com.web.app.dto;

import lombok.Data;

/**
 * UD05UpdateHdocAdcaModification リクエスト DTO
 * ModifyDocument 画面の修正内容を封装する
 */
@Data
public class UD05UpdateHdocAdcaModificationRequest {

    /**
     * 更新ユーザーID
     */
    private String userId;

    /**
     * シャーシシリーズ
     */
    private String chassisSeries;

    /**
     * シャーシNo
     */
    private String chassisNo;

    /**
     * 修正値
     */
    private String modifiedValue;
}
