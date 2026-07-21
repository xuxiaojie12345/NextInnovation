package com.web.app.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class UD05UpdateModificationRequest {
    private String chassisNo;
    private List<VariableEntry> variables;

    @Data
    public static class VariableEntry {
        private String variable;
        private String newValue;
    }
}
