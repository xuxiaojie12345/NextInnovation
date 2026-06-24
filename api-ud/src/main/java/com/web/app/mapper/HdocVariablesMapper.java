package com.web.app.mapper;

import com.web.app.entity.HdocVariables;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * HDoc变量Mapper接口
 */
@Mapper
public interface HdocVariablesMapper {
    
    /**
     * 根据变量名查询
     */
    int countByVariable(@Param("variable") String variable);
    
    /**
     * 插入变量
     */
    int insert(HdocVariables variables);
    
    /**
     * 更新变量
     */
    int update(HdocVariables variables);
    
    /**
     * 删除变量
     */
    int deleteByVariable(@Param("variable") String variable);
    
    /**
     * 搜索变量
     */
    List<HdocVariables> searchVariables(HdocVariables variables);

    /**
     * UD08 - 查询所有变量名（仅VARIABLE字段）
     * SQL: SELECT VARIABLE FROM HDOC_VARIABLES
     */
    List<HdocVariables> selectAllVariables();
}
