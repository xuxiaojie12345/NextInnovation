package com.web.app.mapper;

import com.web.app.domain.Entity.HdocUserDefinedRules;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD08 HDOC User Defined Rules Mapper
 * 用于操作用户定义规则数据
 */
@Mapper
public interface HdocUserDefinedRulesMapper {
    
    /**
     * 查询所有产品类别主数据
     * 
     * @return 产品类别列表
     */
    List<com.web.app.domain.Entity.ProductClassMaster> selectProductClassMaster();
    
    /**
     * 查询所有市场主数据
     * 
     * @return 市场列表
     */
    List<com.web.app.domain.Entity.MarketMaster> selectMarketMaster();
    
    /**
     * 查询所有HDOC变量
     * 
     * @return HDOC变量列表
     */
    List<com.web.app.domain.Entity.HdocVariables> selectHdocVariables();
    
    /**
     * 根据主键查询用户定义规则
     * 
     * @param pc Product class
     * @param num Number
     * @param market Market
     * @return 用户定义规则
     */
    HdocUserDefinedRules selectByPrimaryKey(@Param("pc") String pc, 
                                            @Param("num") Integer num, 
                                            @Param("market") String market);
    
    /**
     * 检查记录是否存在
     * 
     * @param pc Product class
     * @param num Number
     * @param market Market
     * @return 记录数量
     */
    int countByPrimaryKey(@Param("pc") String pc, 
                         @Param("num") Integer num, 
                         @Param("market") String market);
    
    /**
     * 插入用户定义规则
     * 
     * @param rules 用户定义规则
     * @return 影响行数
     */
    int insert(HdocUserDefinedRules rules);
    
    /**
     * 更新用户定义规则
     * 
     * @param rules 用户定义规则
     * @return 影响行数
     */
    int update(HdocUserDefinedRules rules);
    
    /**
     * 软删除用户定义规则（更新删除日期）
     * 
     * @param pc Product class
     * @param num Number
     * @param market Market
     * @param updateUser 更新用户
     * @return 影响行数
     */
    int softDelete(@Param("pc") String pc, 
                   @Param("num") Integer num, 
                   @Param("market") String market,
                   @Param("updateUser") String updateUser);

    // ========== UD09 Methods ==========

    /**
     * UD09: 搜索用户定义规则（支持多条件模糊查询及操作符）
     *
     * @param productClass   产品类别
     * @param pcOp           产品类别操作符
     * @param number         编号
     * @param numOp          编号操作符
     * @param market         市场
     * @param marketOp       市场操作符
     * @param variable       变量
     * @param varOp          变量操作符
     * @param value          值
     * @param valOp          值操作符
     * @param variantString1 变体字符串1
     * @param vs1Op          变体字符串1操作符
     * @param variantString2 变体字符串2
     * @param vs2Op          变体字符串2操作符
     * @param comments       备注
     * @param cmtOp          备注操作符
     * @param addDate        Add日期
     * @param addOp          Add日期操作符
     * @param deleteDate     Delete日期
     * @param delOp          Delete日期操作符
     * @param createdByUser  创建用户
     * @param userOp         创建用户操作符
     * @param date           日期
     * @param dateOp         日期操作符
     * @return 用户定义规则列表
     */
    List<HdocUserDefinedRules> searchUserDefinedRules(
            @Param("productClass") String productClass,
            @Param("pcOp") String pcOp,
            @Param("number") Integer number,
            @Param("numOp") String numOp,
            @Param("market") String market,
            @Param("marketOp") String marketOp,
            @Param("variable") String variable,
            @Param("varOp") String varOp,
            @Param("value") String value,
            @Param("valOp") String valOp,
            @Param("variantString1") String variantString1,
            @Param("vs1Op") String vs1Op,
            @Param("variantString2") String variantString2,
            @Param("vs2Op") String vs2Op,
            @Param("comments") String comments,
            @Param("cmtOp") String cmtOp,
            @Param("addDate") String addDate,
            @Param("addOp") String addOp,
            @Param("deleteDate") String deleteDate,
            @Param("delOp") String delOp,
            @Param("createdByUser") String createdByUser,
            @Param("userOp") String userOp,
            @Param("date") String date,
            @Param("dateOp") String dateOp);
}
