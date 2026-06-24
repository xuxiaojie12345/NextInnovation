package com.web.app.domain;

/**
 * UD25用户信息响应DTO
 * 对应UD25EduUserViewApi返回格式
 * 字段名使用驼峰命名，与前端EDBUserView组件UserInfo接口对齐
 */
public class UD25UserInfoResponse {

    /**
     * 用户ID
     */
    private String userid;

    /**
     * 负责人
     */
    private String responsible;

    /**
     * 用户职位
     */
    private String userPosition;

    /**
     * 邮箱
     */
    private String email;

    public String getUserid() {
        return userid;
    }

    public void setUserid(String userid) {
        this.userid = userid;
    }

    public String getResponsible() {
        return responsible;
    }

    public void setResponsible(String responsible) {
        this.responsible = responsible;
    }

    public String getUserPosition() {
        return userPosition;
    }

    public void setUserPosition(String userPosition) {
        this.userPosition = userPosition;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
