package com.web.app.mapper;

import com.web.app.domain.UD10SearchRequest;
import com.web.app.domain.entity.HdocVariable;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD11数据访问层
 * HDOC_VARIABLES表检索
 * 对应全体APIのプロンプト.txt 【UD11HdocvariablesApi】
 */
@Mapper
public interface UD11Mapper {

    /**
     * UD11Search - 根据搜索条件查询HDOC_VARIABLES变量定义列表
     * 支持Variable、Type、Description、Created by user、Date字段的动态条件查询
     */
    List<HdocVariable> searchHdocVariables(@Param("request") UD10SearchRequest request);
}
