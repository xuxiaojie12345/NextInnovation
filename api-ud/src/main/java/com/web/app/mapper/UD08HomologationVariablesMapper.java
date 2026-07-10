package com.web.app.mapper;

import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.entity.MarketMaster;
import com.web.app.entity.ProductClassMaster;
import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UD08HomologationVariablesMapper {

  List<ProductClassMaster> selectProductClassMaster();

  List<MarketMaster> selectMarketMaster();

  int countVariable(@Param("variable") String variable);

  int countDefinedRules(
      @Param("pc") String pc, @Param("num") String num, @Param("market") String market);

  int insertRule(HdocUserDefinedRules rule);

  int updateRule(HdocUserDefinedRules rule);

  int deleteRule(@Param("pc") String pc, @Param("num") String num, @Param("market") String market);

  List<Map<String, Object>> searchRules(
      @Param("pc") String pc,
      @Param("num") String num,
      @Param("market") String market,
      @Param("variable") String variable,
      @Param("val") String val,
      @Param("pcOp1") String pcOp1,
      @Param("numOp1") String numOp1,
      @Param("marketOp1") String marketOp1,
      @Param("variableOp1") String variableOp1,
      @Param("valOp1") String valOp1,
      @Param("vs") String vs,
      @Param("vsOp1") String vsOp1,
      @Param("vsOp2") String vsOp2,
      @Param("vsVal2") String vsVal2,
      @Param("comments") String comments,
      @Param("commentsOp1") String commentsOp1,
      @Param("addDate") String addDate,
      @Param("addDateOp1") String addDateOp1,
      @Param("deleteDate") String deleteDate,
      @Param("deleteDateOp1") String deleteDateOp1,
      @Param("createdBy") String createdBy,
      @Param("createdByOp1") String createdByOp1,
      @Param("date") String date,
      @Param("dateOp1") String dateOp1);

  int deleteSelectedRules(@Param("records") List<RuleKey> records);

  class RuleKey {
    private String pc;
    private String num;
    private String market;

    public String getPc() {
      return pc;
    }

    public void setPc(String pc) {
      this.pc = pc;
    }

    public String getNum() {
      return num;
    }

    public void setNum(String num) {
      this.num = num;
    }

    public String getMarket() {
      return market;
    }

    public void setMarket(String market) {
      this.market = market;
    }
  }
}
