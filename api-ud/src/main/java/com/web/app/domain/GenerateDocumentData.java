package com.web.app.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * 生成文档数据响应对象
 */
@Data
public class GenerateDocumentData implements Serializable {
    private static final long serialVersionUID = 1L;

    private String orderNumber;              // Ordernumber - 订单号
    private String buildWeek;                // Build week - 生产周
    private String specWeek;                 // Spec week - 规格周
    private String market;                   // Market - 市场
    @JsonProperty("sNoteNo")
    private String sNoteNo;                  // S-Note NO - S-Note编号
    private String loadIndex;                // Load Index - 载重指数
    private Boolean adChangeActive;          // AD-Change状态
    private List<ReplacementParam> replacementParams; // Replacing parameters - 替换参数列表
    private String Date;                     // Date - 日期时间

    /**
     * 替换参数内部类
     */
    @Data
    public static class ReplacementParam implements Serializable {
        private static final long serialVersionUID = 1L;
        private String variable;  // 变量名
        private String newVal;    // 新值
    }
}
