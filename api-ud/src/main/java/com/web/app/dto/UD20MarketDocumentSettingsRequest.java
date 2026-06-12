package com.web.app.dto;

import lombok.Data;

@Data
public class UD20MarketDocumentSettingsRequest {
    private String documentType;
    private String businessUnit;
    private String user;
    private String date;
}
