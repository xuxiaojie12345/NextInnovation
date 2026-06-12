package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD14RulesResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private List<RuleItem> rules;
    }

    @Data
    public static class RuleItem {
        private String variable;
    }

    public static UD14RulesResponse success(List<RuleItem> rules) {
        UD14RulesResponse res = new UD14RulesResponse();
        res.setCode(200);
        res.setMsg("查询成功");
        DataInfo d = new DataInfo();
        d.setRules(rules);
        res.setData(d);
        return res;
    }
}
