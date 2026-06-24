package com.web.app.domain;

/**
 * UD15请求DTO - VIN Plate数据查看与状态更新
 */
public class UD15Request {

    private String chassisNumber;
    private String operation;

    public String getChassisNumber() {
        return chassisNumber;
    }

    public void setChassisNumber(String chassisNumber) {
        this.chassisNumber = chassisNumber;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }
}
