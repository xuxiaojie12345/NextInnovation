package com.web.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModificationDetailResponse {
    private String serie;
    private String chassisNo;
    private String doctype;
    private Integer version;
    private List<ModificationItem> modifications;
    private Boolean foundUnreleasedVersion;
    private String message;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModificationItem {
        private String variable;
        private String newValue;
    }
}
