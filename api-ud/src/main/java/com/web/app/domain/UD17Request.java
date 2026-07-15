package com.web.app.domain;

import java.util.List;
import java.util.Map;

/**
 * UD17请求DTO - 用户权限管理
 */
 /**

  * UD17Request

  */

public class UD17Request {

/** userid */

    private String userid;
    /** operation */

    private String operation;
    /** functions */

    private List<String> functions;
    private List<Map<String, String>> markets;
    /** updateUser */

    private String updateUser;
    /** updateProcess */

    private String updateProcess;

    public String getUserid() { return userid; }
    public void setUserid(String userid) { this.userid = userid; }
    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }
    public List<String> getFunctions() { return functions; }
    public void setFunctions(List<String> functions) { this.functions = functions; }
    public List<Map<String, String>> getMarkets() { return markets; }
    public void setMarkets(List<Map<String, String>> markets) { this.markets = markets; }
    public String getUpdateUser() { return updateUser; }
    public void setUpdateUser(String updateUser) { this.updateUser = updateUser; }
    public String getUpdateProcess() { return updateProcess; }
    public void setUpdateProcess(String updateProcess) { this.updateProcess = updateProcess; }
}
