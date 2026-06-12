package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD19SearchResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private List<UserInfo> users;
        private long count;
    }

    @Data
    public static class UserInfo {
        private String userid;
        private String username;
        private List<String> markets;
    }

    public static UD19SearchResponse success(List<UserInfo> users, long count) {
        UD19SearchResponse res = new UD19SearchResponse();
        res.setCode(200);
        res.setMsg("查询成功");
        DataInfo d = new DataInfo();
        d.setUsers(users);
        d.setCount(count);
        res.setData(d);
        return res;
    }
}
