package com.web.app.mapper;

import com.web.app.domain.UD10SearchRequest;
import com.web.app.domain.entity.HdocVariable;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD10数据访问层
 * HDOC_VARIABLES表的增删改查
 * 对应全体APIのプロンプト.txt 【UD10HdocvariablesApi】
 */
@Mapper
/**

 * UD10Mapper

 */

public interface UD10Mapper {

    /**
     * UD10Search - 根据搜索条件查询HDOC_VARIABLES变量定义列表
     * 支持按Variable、Type、Description、Created by user、Date等字段动态查询
     * 每个字段配合对应的Op运算符动态生成条件
     */
    List<HdocVariable> searchHdocVariables(@Param("request") UD10SearchRequest request);

    /**
     * 根据Variable查询变量定义详情
     * GET /api/ud10/hdocvariables/{variable}
     */
    HdocVariable selectByVariable(@Param("variable") String variable);

    /**
     * 检查Variable是否已存在（用于Add时的重复检查）
     */
    int countByVariable(@Param("variable") String variable);

    /**
     * UD10Add - 新增变量定义记录
     * INSERT INTO HDOC_VARIABLES
     */
    int insert(HdocVariable record);

    /**
     * UD10Update - 更新变量定义记录
     * UPDATE HDOC_VARIABLES
     */
    int updateByVariable(HdocVariable record);

    /**
     * UD10Delete - 删除变量定义记录
     * DELETE FROM HDOC_VARIABLES WHERE VARIABLE = #{variable}
     */
    int deleteByVariable(@Param("variable") String variable);
}
