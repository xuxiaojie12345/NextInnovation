package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD05UpdateModificationRequest {
    private List<ModificationItem> modifications;

    @Data
    public static class ModificationItem {
        private String variable;
        private String newValue;
    }
}
