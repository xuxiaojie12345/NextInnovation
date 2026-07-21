package com.web.app.mapper;

import com.web.app.entity.HdocUserDefinedRules;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface HdocUserDefinedRulesMapper {
    List<HdocUserDefinedRules> selectAll();
    HdocUserDefinedRules selectByPcNumMarket(@Param("pc") String pc, @Param("num") String num, @Param("market") String market);
    List<HdocUserDefinedRules> selectByCondition(@Param("pc") String pc, @Param("num") String num,
        @Param("market") String market, @Param("variable") String variable, @Param("val") String val,
        @Param("vs") String vs, @Param("vs2") String vs2, @Param("comments") String comments,
        @Param("addDateFrom") String addDateFrom, @Param("addDateTo") String addDateTo,
        @Param("deleteDateFrom") String deleteDateFrom, @Param("deleteDateTo") String deleteDateTo,
        @Param("createdByUser") String createdByUser);
    List<String> selectDistinctVariable();
    int insert(HdocUserDefinedRules record);
    int update(HdocUserDefinedRules record);
    int deleteByPcNumMarket(@Param("pc") String pc, @Param("num") String num, @Param("market") String market);
    int deleteBatch(List<HdocUserDefinedRules> list);
}
