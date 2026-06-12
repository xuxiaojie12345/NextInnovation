package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD11SearchResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private List<VariableInfo> variables;
        private long count;
    }

    @Data
    public static class VariableInfo {
        private String variable;
        private String type;
        private String description;
        private String createdByUser;
        private String date;
    }

    public static UD11SearchResponse success(List<VariableInfo> variables, long count) {
        UD11SearchResponse res = new UD11SearchResponse();
        res.setCode(200);
        res.setMsg("查询成功");
        DataInfo d = new DataInfo();
        d.setVariables(variables);
        d.setCount(count);
        res.setData(d);
        return res;
    }
}
