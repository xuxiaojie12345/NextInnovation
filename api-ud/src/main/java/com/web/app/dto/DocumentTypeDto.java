package com.web.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Document type DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentTypeDto {
    private String doctype;
    private String description;
}
