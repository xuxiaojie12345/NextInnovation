package com.web.app.domain;

/**
 * UD16请求DTO - ADCA变更
 */
 /**

  * UD16Request

  */

public class UD16Request {

/** operation */

    private String operation;
    /** serieChnr */

    private String serieChnr;
    /** desc */

    private String desc;
    /** user */

    private String user;
    /** process */

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
