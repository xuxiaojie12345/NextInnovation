package com.web.app.mapper;

import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.entity.MarketMaster;
import com.web.app.entity.ProductClassMaster;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD08 认证变量规则数据访问层
 *
 * 功能说明：执行产品类别、市场、HDOC变量和用户定义规则的数据操作
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD08HomologationVariablesMapper {

        /**
         * 查询所有产品类别
         *
         * @return 产品类别列表
         */
        List<ProductClassMaster> selectAllProductClass();

        /**
         * 查询所有市场
         *
         * @return 市场列表
         */
        List<MarketMaster> selectAllMarket();

        /**
         * 检查HDOC变量是否存在
         *
         * @param variables 变量名
         * @return 记录数
         */
        Integer countHdocVariables(@Param("variables") String variables);

        /**
         * 根据PC+NUM+MARKET查询用户定义规则数量
         *
         * @param pc     PC代码
         * @param num    序号
         * @param market 市场
         * @return 记录数
         */
        Integer countUserDefinedRule(@Param("pc") String pc,
                        @Param("num") Long num,
                        @Param("market") String market);

        /**
         * 插入用户定义规则
         *
         * @param rule 规则实体
         * @return 影响行数
         */
        Integer insertUserDefinedRule(HdocUserDefinedRules rule);

        /**
         * 更新用户定义规则
         *
         * @param rule 规则实体
         * @return 影响行数
         */
        Integer updateUserDefinedRule(HdocUserDefinedRules rule);

        /**
         * 删除用户定义规则
         *
         * @param pc     PC代码
         * @param num    序号
         * @param market 市场
         * @return 影响行数
         */
        Integer deleteUserDefinedRule(@Param("pc") String pc,
                        @Param("num") Long num,
                        @Param("market") String market);
}
