package com.web.app.dto.request;

import lombok.Data;

@Data
public class UD16InsertAdcaChangeRequest {
    private String serie;
    private String chnr;
    private String reason;
}
