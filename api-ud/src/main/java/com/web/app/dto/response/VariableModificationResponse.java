package com.web.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VariableModificationResponse {
    private List<VariableItem> variables;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariableItem {
        private String variable;
        private String description;
        private String currentValue;
        private String modifiedValue;
        private boolean editable;
    }
}
