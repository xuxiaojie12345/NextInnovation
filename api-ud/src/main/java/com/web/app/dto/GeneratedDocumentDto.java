package com.web.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 生成文档数据 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedDocumentDto {
    private String chassisNo;
    private String ordernumber;
    private String buildWeek;
    private String specWeek;
    private String market;
    private String masterMarket;
    private String sNoteNo;
    private String loadIndex;
    private String modifyDocAct;
    private String usingTemplate;
    private List<ReplacingParameterDto> replacingParameters;
    private String date;
    private String hdocVersion;
}
