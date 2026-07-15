package com.web.app.controller;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocUserDefinedRules;
import com.web.app.service.UD08HomologationVariablesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * UD08 Homologation Variables Controller
 * 提供Homologation Variables相关API接口
 */
@Slf4j
@RestController
@RequestMapping("/api/ud08HomologationVariables")
@CrossOrigin(
    origins = "*",
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class UD08HomologationVariablesController {

    @Autowired
    private UD08HomologationVariablesService ud08HomologationVariablesService;

    /**
     * 获取产品类别主数据
     * 
     * @return API响应，包含产品类别列表
     */
    @GetMapping("/getProductClassMaster")
    public ResponseEntity<ApiResponse<?>> getProductClassMaster() {
        ApiResponse<?> response = ud08HomologationVariablesService.getProductClassMaster();

        if (response.getData() != null) {
            log.info("Data count: {}", 
                response.getData() instanceof java.util.List ? 
                ((java.util.List<?>) response.getData()).size() : "N/A");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 获取市场主数据
     * 
     * @return API响应，包含市场列表
     */
    @GetMapping("/getMarketMaster")
    public ResponseEntity<ApiResponse<?>> getMarketMaster() {
        ApiResponse<?> response = ud08HomologationVariablesService.getMarketMaster();

        return ResponseEntity.ok(response);
    }

    /**
     * 获取HDOC变量信息
     * 
     * @return API响应，包含HDOC变量列表
     */
    @GetMapping("/getHdocVariables")
    public ResponseEntity<ApiResponse<?>> getHdocVariables() {

        ApiResponse<?> response = ud08HomologationVariablesService.getHdocVariables();

        return ResponseEntity.ok(response);
    }

    /**
     * 添加用户定义规则
     * 
     * @param rules 用户定义规则
     * @return API响应
     */
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<?>> addUserDefinedRule(@RequestBody HdocUserDefinedRules rules) {

        ApiResponse<?> response = ud08HomologationVariablesService.addUserDefinedRule(rules);

        return ResponseEntity.ok(response);
    }

    /**
     * 更新用户定义规则
     * 
     * @param rules 用户定义规则
     * @return API响应
     */
    @PostMapping("/update")
    public ResponseEntity<ApiResponse<?>> updateUserDefinedRule(@RequestBody HdocUserDefinedRules rules) {

        ApiResponse<?> response = ud08HomologationVariablesService.updateUserDefinedRule(rules);

        return ResponseEntity.ok(response);
    }

    /**
     * 删除用户定义规则
     * 
     * @param rules 包含主键信息和用户信息的对象
     * @return API响应
     */
    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse<?>> deleteUserDefinedRule(@RequestBody HdocUserDefinedRules rules) {
        // 从请求中获取用户信息（userid 字段）
        String updateUser = rules.getUserid();
        
        ApiResponse<?> response = ud08HomologationVariablesService.deleteUserDefinedRule(
            rules.getPc(), rules.getNum(), rules.getMarket(), updateUser);

        return ResponseEntity.ok(response);
    }
    
    /**
     * 获取当前用户信息和日期
     * 
     * @return API响应，包含用户信息和当前日期
     */
    @GetMapping("/getCurrentUserInfo")
    public ResponseEntity<ApiResponse<?>> getCurrentUserInfo() {
        try {
            // 构建返回数据
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            
            // 获取当前用户（实际应从 session/token 中获取）
            String currentUser = "SYSTEM"; // 临时使用 SYSTEM，实际应从安全上下文获取
            data.put("currentUser", currentUser);
            
            // 获取当前日期时间
            java.text.SimpleDateFormat dateFormat = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            String currentDateTime = dateFormat.format(new java.util.Date());
            data.put("currentDateTime", currentDateTime);
            
            // 获取当前月份（YYYYMM格式）
            java.text.SimpleDateFormat monthFormat = new java.text.SimpleDateFormat("yyyyMM");
            String currentMonth = monthFormat.format(new java.util.Date());
            data.put("currentMonth", currentMonth);
            
            return ResponseEntity.ok(ApiResponse.success("获取当前用户信息成功", data));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error(500, "系统内部错误，请联系管理员"));
        }
    }
    
}
