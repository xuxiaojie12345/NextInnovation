package com.web.app.mapper;

import com.web.app.entity.HdocUserDefinedRules;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * 用户定义规则Mapper接口
 */
@Mapper
public interface HdocUserDefinedRulesMapper {
    
    /**
     * 根据条件查询
     */
    int countByCondition(@Param("pc") String pc, @Param("num") String num, @Param("market") String market);
    
    /**
     * 插入规则
     */
    int insert(HdocUserDefinedRules rules);
    
    /**
     * 更新规则
     */
    int update(HdocUserDefinedRules rules);
    
    /**
     * 删除规则
     */
    int deleteByCondition(@Param("pc") String pc, @Param("num") String num, @Param("market") String market);
    
    /**
     * 搜索规则
     */
    List<HdocUserDefinedRules> searchRules(HdocUserDefinedRules rules);
    
    /**
     * 根据市场查询变量
     */
    List<String> selectVariablesByMarket(@Param("market") String market);
}
