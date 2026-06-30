package com.web.app.mapper;

import com.web.app.entity.HdocUserDefinedRules;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface HdocUserDefinedRulesMapper {
    int updateByPcNumMarket(HdocUserDefinedRules record);
    int insertUserDefinedRules(HdocUserDefinedRules record);
    int deleteByPcNumMarket(@Param("pc") String pc, @Param("num") java.math.BigDecimal num, @Param("market") String market);
    List<HdocUserDefinedRules> searchUserDefinedRules(HdocUserDefinedRules params);
    int deleteSelected(HdocUserDefinedRules params);
    int countUserDefinedRules(HdocUserDefinedRules params);
    List<String> selectVariableByMarket(@Param("market") String market);
    List<HdocUserDefinedRules> selectByMarket(@Param("market") String market);
}
