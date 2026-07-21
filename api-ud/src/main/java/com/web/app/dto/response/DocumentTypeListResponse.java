package com.web.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentTypeListResponse {
    private List<DocumentTypeItem> documentTypes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentTypeItem {
        private String code;
        private String description;
    }
}
