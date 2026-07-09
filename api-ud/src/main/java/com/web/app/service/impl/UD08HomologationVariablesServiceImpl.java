package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocUserDefinedRules;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.service.UD08HomologationVariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD08 Homologation Variables Service Implementation
 * Homologation Variables业务逻辑实现类
 */
@Service
public class UD08HomologationVariablesServiceImpl implements UD08HomologationVariablesService {
    
    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;
    
    /**
     * 获取产品类别主数据
     * 
     * @return API响应，包含产品类别列表
     */
    @Override
    public ApiResponse<?> getProductClassMaster() {
        
        try {
            // 调用Mapper查询所有产品类别
            List<com.web.app.domain.Entity.ProductClassMaster> list = 
                hdocUserDefinedRulesMapper.selectProductClassMaster();
            
            // 验证查询结果
            if (list == null || list.isEmpty()) {
                return ApiResponse.success("获取产品类别主数据成功", list);
            }
            
            return ApiResponse.success("获取产品类别主数据成功", list);
            
        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
    
    /**
     * 获取市场主数据
     * 
     * @return API响应，包含市场列表
     */
    @Override
    public ApiResponse<?> getMarketMaster() {
        
        try {
            // 调用Mapper查询所有市场
            List<com.web.app.domain.Entity.MarketMaster> list = 
                hdocUserDefinedRulesMapper.selectMarketMaster();
            
            // 验证查询结果
            if (list == null || list.isEmpty()) {

                return ApiResponse.success("获取市场主数据成功", list);
            }
            return ApiResponse.success("获取市场主数据成功", list);
            
        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
    
    /**
     * 获取HDOC变量信息
     * 
     * @return API响应，包含HDOC变量列表
     */
    @Override
    public ApiResponse<?> getHdocVariables() {
        
        try {
            // 调用Mapper查询所有HDOC变量
            List<com.web.app.domain.Entity.HdocVariables> list = 
                hdocUserDefinedRulesMapper.selectHdocVariables();
            
            // 验证查询结果
            if (list == null || list.isEmpty()) {
                return ApiResponse.success("获取HDOC变量信息成功", list);
            }
            
            return ApiResponse.success("获取HDOC变量信息成功", list);
            
        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
    
    /**
     * 添加用户定义规则
     * 
     * @param rules 用户定义规则
     * @return API响应
     */
    @Override
    public ApiResponse<?> addUserDefinedRule(HdocUserDefinedRules rules) {
        
        try {
            // 参数校验
            if (rules.getPc() == null || rules.getPc().trim().isEmpty()) {
                return ApiResponse.error(400, "Product class不能为空");
            }
            if (rules.getNum() == null) {
                return ApiResponse.error(400, "Number不能为空");
            }
            if (rules.getMarket() == null || rules.getMarket().trim().isEmpty()) {
                return ApiResponse.error(400, "Market不能为空");
            }
            
            // 字段长度校验
            if (rules.getVs() != null && rules.getVs().length() > 100) {
                return ApiResponse.error(400, "Variant string.1长度不能超过100");
            }
            if (rules.getVs2() != null && rules.getVs2().length() > 100) {
                return ApiResponse.error(400, "Variant string.2长度不能超过100");
            }
            if (rules.getVariable() != null && rules.getVariable().length() > 20) {
                return ApiResponse.error(400, "Variable长度不能超过20");
            }
            if (rules.getVal() != null && rules.getVal().length() > 200) {
                return ApiResponse.error(400, "Value长度不能超过200");
            }
            
            // 检查主键是否已存在
            int count = hdocUserDefinedRulesMapper.countByPrimaryKey(
                rules.getPc(), rules.getNum(), rules.getMarket());
            
            if (count > 0) {
                return ApiResponse.error(409, "Primary key conflict, Please enter the correct content");
            }
            
            // 设置系统字段（addDate使用画面传入的值，为空时使用当前年月）
            if (rules.getAddDate() == null || rules.getAddDate().trim().isEmpty()) {
                rules.setAddDate(new SimpleDateFormat("yyyyMM").format(new Date()));
            }
            String currentUser = rules.getUserid() != null ? rules.getUserid() : "SYSTEM";
            rules.setUpDate(new SimpleDateFormat("yyyyMM").format(new Date()));
            rules.setRegisterDatetime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
            rules.setRegisterUser(currentUser);
            rules.setRegisterProcess("UD08_ADD");
            rules.setUpdateDatetime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
            rules.setUpdateUser(currentUser);
            rules.setUpdateProcess("UD08_ADD");

            // 执行插入操作
            int result = hdocUserDefinedRulesMapper.insert(rules);
            
            if (result > 0) {
                
                // 构建返回数据
                Map<String, Object> data = new HashMap<>();
                data.put("pc", rules.getPc());
                data.put("num", rules.getNum());
                data.put("market", rules.getMarket());
                
                return ApiResponse.success("添加用户定义规则成功", data);
            } else {
                return ApiResponse.error(500, "添加失败");
            }
            
        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
    
    /**
     * 更新用户定义规则
     * 
     * @param rules 用户定义规则
     * @return API响应
     */
    @Override
    public ApiResponse<?> updateUserDefinedRule(HdocUserDefinedRules rules) {
        
        try {
            // 参数校验
            if (rules.getPc() == null || rules.getPc().trim().isEmpty()) {
                return ApiResponse.error(400, "Product class不能为空");
            }
            if (rules.getNum() == null) {
                return ApiResponse.error(400, "Number不能为空");
            }
            if (rules.getMarket() == null || rules.getMarket().trim().isEmpty()) {
                return ApiResponse.error(400, "Market不能为空");
            }
            
            // 字段长度校验
            if (rules.getVs() != null && rules.getVs().length() > 100) {
                return ApiResponse.error(400, "Variant string.1长度不能超过100");
            }
            if (rules.getVs2() != null && rules.getVs2().length() > 100) {
                return ApiResponse.error(400, "Variant string.2长度不能超过100");
            }
            if (rules.getVariable() != null && rules.getVariable().length() > 20) {
                return ApiResponse.error(400, "Variable长度不能超过20");
            }
            if (rules.getVal() != null && rules.getVal().length() > 200) {
                return ApiResponse.error(400, "Value长度不能超过200");
            }
            
            // 检查记录是否存在
            int count = hdocUserDefinedRulesMapper.countByPrimaryKey(
                rules.getPc(), rules.getNum(), rules.getMarket());
            
            if (count == 0) {
                return ApiResponse.error(404, "Data does not exist, Please enter the correct content");
            }
            
            // 设置系统字段
            String currentUser = rules.getUserid() != null ? rules.getUserid() : "SYSTEM";
            
            rules.setUpdateDatetime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
            rules.setUpdateUser(currentUser);
            rules.setUpdateProcess("UD08_UPDATE");
            
            // 执行更新操作
            int result = hdocUserDefinedRulesMapper.update(rules);
            
            if (result > 0) {
                
                // 构建返回数据
                Map<String, Object> data = new HashMap<>();
                data.put("pc", rules.getPc());
                data.put("num", rules.getNum());
                data.put("market", rules.getMarket());
                
                return ApiResponse.success("更新用户定义规则成功", data);
            } else {
                return ApiResponse.error(500, "更新失败");
            }
            
        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
    
    /**
     * 删除用户定义规则
     * 
     * @param pc Product class
     * @param num Number
     * @param market Market
     * @param updateUser 更新用户（从前端传入）
     * @return API响应
     */
    @Override
    public ApiResponse<?> deleteUserDefinedRule(String pc, Integer num, String market, String updateUser) {
        
        try {
            // 参数校验
            if (pc == null || pc.trim().isEmpty()) {
                return ApiResponse.error(400, "Product class不能为空");
            }
            if (num == null) {
                return ApiResponse.error(400, "Number不能为空");
            }
            if (market == null || market.trim().isEmpty()) {
                return ApiResponse.error(400, "Market不能为空");
            }
            
            // 使用前端传来的用户信息，如果为空则使用默认值
            String currentUser = updateUser != null ? updateUser : "SYSTEM";
            
            // 检查记录是否存在
            int count = hdocUserDefinedRulesMapper.countByPrimaryKey(pc, num, market);
            
            if (count == 0) {
                return ApiResponse.error(404, "Data does not exist, Please enter the correct content");
            }
            
            // 执行软删除操作
            int result = hdocUserDefinedRulesMapper.softDelete(pc, num, market, currentUser);
            
            if (result > 0) {
                
                // 构建返回数据
                Map<String, Object> data = new HashMap<>();
                data.put("pc", pc);
                data.put("num", num);
                data.put("market", market);
                
                return ApiResponse.success("删除用户定义规则成功", data);
            } else {
                return ApiResponse.error(500, "删除失败");
            }
            
        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
    
}
