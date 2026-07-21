package com.web.app.dto.request;

import lombok.Data;

@Data
public class UD10SearchRequest {
    private String variable;
    private String type;
    private String description;
    private String createdByUser;
    private String dateFrom;
    private String dateTo;
}
