package com.web.app.mapper;

import com.web.app.domain.UD08SearchRequest;
import com.web.app.domain.entity.HdocUserDefinedRules;
import com.web.app.domain.entity.HdocVariable;
import com.web.app.domain.entity.MarketMaster;
import com.web.app.domain.entity.ProductClassMaster;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD08数据访问层
 * 认证变量管理（Homologation Variables）
 */
@Mapper
/**

 * UD08Mapper

 */

public interface UD08Mapper {

    /**
     * 查询所有产品类别（全检索PRODUCT_CLASS_MASTER表）
     */
    List<ProductClassMaster> selectAllProductClassMaster();

    /**
     * 查询所有市场信息（全检索MARKET_MASTER表）
     */
    List<MarketMaster> selectAllMarketMaster();

    /**
     * 查询所有HDOC变量VARIABLE字段（全检索HDOC_VARIABLES表）
     */
    List<HdocVariable> selectAllHdocVariables();

    /**
     * 根据主键查询用户自定义规则
     */
    HdocUserDefinedRules selectByPrimaryKey(
            @Param("pc") String pc,
            @Param("num") String num,
            @Param("market") String market);

    /**
     * 检查主键是否已存在（用于Add时的重复检查）
     */
    int countByPrimaryKey(
            @Param("pc") String pc,
            @Param("num") String num,
            @Param("market") String market);

    /**
     * 检查主键是否已存在（排除自身，用于Update时的重复检查）
     */
    int countByPrimaryKeyExcludeSelf(
            @Param("pc") String pc,
            @Param("num") String num,
            @Param("market") String market,
            @Param("oldPc") String oldPc,
            @Param("oldNum") String oldNum,
            @Param("oldMarket") String oldMarket);

    /**
     * 根据Variable查询HDOC_VARIABLES中是否存在
     */
    int countByVariable(@Param("variable") String variable);

    /**
     * 新增用户自定义规则
     */
    int insert(HdocUserDefinedRules record);

    /**
     * 更新用户自定义规则
     */
    int updateByPrimaryKey(HdocUserDefinedRules record);

    /**
     * 删除用户自定义规则
     */
    int deleteByPrimaryKey(
            @Param("pc") String pc,
            @Param("num") String num,
            @Param("market") String market);

    /**
     * UD08Search - 根据搜索条件查询用户自定义规则列表
     * 支持按PC、NUM、MARKET、VARIABLE等字段模糊查询
     */
    List<HdocUserDefinedRules> searchUserDefinedRules(@Param("request") UD08SearchRequest request);

    /**
     * UD09DeleteHdocuserdefinedrules - 批量删除用户自定义规则
     * 根据主键（PC、NUM、MARKET）删除记录
     */
    int batchDeleteByPrimaryKey(
            @Param("pc") String pc,
            @Param("num") String num,
            @Param("market") String market);
}
