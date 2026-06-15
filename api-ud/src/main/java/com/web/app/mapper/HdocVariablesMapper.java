package com.web.app.mapper;

import com.web.app.domain.Entity.HdocVariables;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

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
}
