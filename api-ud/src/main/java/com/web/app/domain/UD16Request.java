package com.web.app.domain;

/**
 * UD16请求DTO - ADCA变更
 */
public class UD16Request {

    private String operation;
    private String serieChnr;
    private String desc;
    private String user;
    private String process;

    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }
    public String getSerieChnr() { return serieChnr; }
    public void setSerieChnr(String serieChnr) { this.serieChnr = serieChnr; }
    public String getDesc() { return desc; }
    public void setDesc(String desc) { this.desc = desc; }
    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }
    public String getProcess() { return process; }
    public void setProcess(String process) { this.process = process; }
}
