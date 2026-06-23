package com.web.app.mapper;

import com.web.app.domain.HdocVariables;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

/**
 * HDOC_VARIABLES Mapper接口
 */
@Mapper
public interface HdocVariablesMapper {

    /**
     * 查询所有HDoc变量
     * 
     * @return 变量列表
     */
    List<HdocVariables> selectAllVariables();

    /**
     * 根据Variable查询记录数（存在性检查）
     *
     * @param variable 变量名
     * @return 记录数
     */
    @Select("SELECT COUNT(1) FROM HDOC_VARIABLES WHERE VARIABLE = #{variable}")
    int countByVariable(@Param("variable") String variable);

    /**
     * 新增Variable
     *
     * @param entity 实体
     * @return 影响行数
     */
    int insertVariable(HdocVariables entity);

    /**
     * 根据Variable更新
     *
     * @param entity 实体
     * @return 影响行数
     */
    int updateByVariable(HdocVariables entity);

    /**
     * 根据Variable删除
     *
     * @param variable 变量名
     * @return 影响行数
     */
    @Delete("DELETE FROM HDOC_VARIABLES WHERE VARIABLE = #{variable}")
    int deleteByVariable(@Param("variable") String variable);

    /**
     * 根据条件搜索Variables
     *
     * @param params 查询条件
     * @return 变量列表
     */
    List<Map<String, Object>> searchByConditions(Map<String, Object> params);
}
