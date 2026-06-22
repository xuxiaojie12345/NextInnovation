package com.web.app.dto;

import lombok.Data;

@Data
public class GenerateDocumentRequest {
    private String serie;
    private String chnr;
    private String doctype;
}
