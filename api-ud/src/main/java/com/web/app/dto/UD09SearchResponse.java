package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD09SearchResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private List<RuleRecord> records;
        private long count;
    }

    @Data
    public static class RuleRecord {
        private String pc;
        private String num;
        private String market;
        private String variable;
        private String val;
        private String vs;
        private String vs2;
        private String comments;
        private String addDate;
        private String deleteDate;
        private String registerUser;
        private String registerDatetime;
    }

    public static UD09SearchResponse success(List<RuleRecord> records, long count) {
        UD09SearchResponse res = new UD09SearchResponse();
        res.setCode(200);
        res.setMsg("Success");
        DataInfo d = new DataInfo();
        d.setRecords(records);
        d.setCount(count);
        res.setData(d);
        return res;
    }
}
