package com.web.app.mapper;

import com.web.app.domain.Entity.HdocVariables;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD10 Hdoc Variables Mapper
 * 用于操作HDOC_VARIABLES表数据
 */
@Mapper
public interface HdocVariablesMapper {

    /**
     * 检查变量是否已存在
     *
     * @param variable 变量名
     * @return 记录数量
     */
    int countByVariable(@Param("variable") String variable);

    /**
     * 插入新变量
     *
     * @param variables 变量实体
     * @return 影响行数
     */
    int insert(HdocVariables variables);

    /**
     * 更新变量
     *
     * @param variables 变量实体
     * @return 影响行数
     */
    int update(HdocVariables variables);

    /**
     * 删除变量（物理删除）
     *
     * @param variable 变量名
     * @return 影响行数
     */
    int deleteByVariable(@Param("variable") String variable);

    /**
     * UD11: 搜索变量（支持精确匹配/模糊查询及操作符）
     *
     * @param variable      变量
     * @param varOp         Variable操作符 (eq/ne)
     * @param type          类型
     * @param typeOp        Type操作符 (eq/ne)
     * @param description   描述
     * @param descrOp       Description操作符 (eq/ne)
     * @param createdByUser 创建用户
     * @param userOp        创建用户操作符 (eq/ne)
     * @param date          日期
     * @param dateOp        日期操作符 (eq/ne)
     * @return 变量列表
     */
    List<HdocVariables> searchVariables(
            @Param("variable") String variable,
            @Param("varOp") String varOp,
            @Param("type") String type,
            @Param("typeOp") String typeOp,
            @Param("description") String description,
            @Param("descrOp") String descrOp,
            @Param("createdByUser") String createdByUser,
            @Param("userOp") String userOp,
            @Param("date") String date,
            @Param("dateOp") String dateOp);
}
