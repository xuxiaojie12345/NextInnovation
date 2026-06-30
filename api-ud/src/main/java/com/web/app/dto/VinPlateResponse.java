package com.web.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/** UD15: VIN Plate响应 */
@Data
public class VinPlateResponse {
    private String type;
    private String status;
    private String msg;
    private String registerDatetime;
    private String docReady;
    private String docSent;
    @JsonProperty("xmlContent")
    private String xmlDoc;
}
