package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocUserDefinedRules;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocUserDefinedRulesMapper {
    int countByPcNumMarket(@Param("pc") String pc, @Param("num") Long num, @Param("market") String market);
    List<HdocUserDefinedRules> searchByCondition(@Param("productClass") String productClass, @Param("number") Long number, @Param("market") String market, @Param("variable") String variable, @Param("value") String value, @Param("string1") String string1, @Param("string2") String string2, @Param("comments") String comments);
    int insert(HdocUserDefinedRules record);
    int updateByPcNumMarket(HdocUserDefinedRules record);
    int deleteByPcNumMarket(@Param("pc") String pc, @Param("num") Long num, @Param("market") String market);
    List<HdocUserDefinedRules> selectByMarket(@Param("market") String market);
    List<HdocUserDefinedRules> searchResultList(@Param("market") String market);
}
