package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class DoctypeListResponse {
    private int code;
    private String msg;
    private List<DoctypeItem> data;

    @Data
    public static class DoctypeItem {
        private String doctype;
    }

    public static DoctypeListResponse success(List<DoctypeItem> data) {
        DoctypeListResponse res = new DoctypeListResponse();
        res.setCode(200);
        res.setMsg("获取成功");
        res.setData(data);
        return res;
    }
}
