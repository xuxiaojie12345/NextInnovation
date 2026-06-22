package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * UD05_ModifyDocument - 变量修改查询响应对象
 * 返回变量列表及其修改信息
 */
@Data
public class SelectVariableModificationResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private List<VariableModificationItem> variables;  // 变量修改列表
}
