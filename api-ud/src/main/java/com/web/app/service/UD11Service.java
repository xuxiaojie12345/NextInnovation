package com.web.app.service;

import com.web.app.domain.UD10SearchRequest;
import com.web.app.domain.entity.HdocVariable;

import java.util.List;

/**
 * UD11业务逻辑接口
 * HDOC变量列表检索
 * 对应全体APIのプロンプト.txt 【UD11HdocvariablesApi】
 */
 /**

  * UD11Service

  */

public interface UD11Service {

    /**
     * UD11Search - 根据搜索条件查询HDOC_VARIABLES变量定义列表
     */
    List<HdocVariable> search(UD10SearchRequest request);
}
