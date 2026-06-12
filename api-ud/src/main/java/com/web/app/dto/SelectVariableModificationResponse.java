package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class SelectVariableModificationResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private List<VariableItem> variables;
    }

    @Data
    public static class VariableItem {
        private String variableName;
        private String description;
        private String currentValue;
        private String modifiedValue;
    }

    public static SelectVariableModificationResponse success(List<VariableItem> variables) {
        SelectVariableModificationResponse res = new SelectVariableModificationResponse();
        res.setCode(200);
        res.setMsg("Success");
        DataInfo d = new DataInfo();
        d.setVariables(variables);
        res.setData(d);
        return res;
    }
}
