package com.web.app.dto;

import lombok.Data;
import java.util.List;

@Data
public class UD17UserInfoResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private String username;
        private List<UD17UserAdminRequest.PermissionInfo> permissions;
    }

    public static UD17UserInfoResponse success(String username, List<UD17UserAdminRequest.PermissionInfo> permissions) {
        UD17UserInfoResponse res = new UD17UserInfoResponse();
        res.setCode(200);
        res.setMsg("获取成功");
        DataInfo d = new DataInfo();
        d.setUsername(username);
        d.setPermissions(permissions);
        res.setData(d);
        return res;
    }

    public static UD17UserInfoResponse error(String msg) {
        UD17UserInfoResponse res = new UD17UserInfoResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
