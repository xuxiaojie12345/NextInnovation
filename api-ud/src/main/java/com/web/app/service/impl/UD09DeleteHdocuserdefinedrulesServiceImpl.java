package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocUserDefinedRules;
import com.web.app.domain.UD09DeleteUserDefinedRulesRequest;
import com.web.app.domain.UD09SearchUserDefinedRulesRequest;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.service.UD09DeleteHdocuserdefinedrulesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * UD09 Delete HDOC User Defined Rules Service Implementation
 * 实现用户定义规则的搜索与删除业务逻辑
 */
@Service
public class UD09DeleteHdocuserdefinedrulesServiceImpl implements UD09DeleteHdocuserdefinedrulesService {

    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    /**
     * 4.4 搜索用户定义规则
     * 对请求参数进行合法性校验，调用Mapper执行查询
     *
     * @param request 搜索请求参数
     * @return API响应，包含用户定义规则列表
     */
    @Override
    public ApiResponse<?> searchUserDefinedRules(UD09SearchUserDefinedRulesRequest request) {

        try {
            // 4.4 参数合法性校验
            // 必填项校验
            if (request.getProductClass() == null || request.getProductClass().trim().isEmpty()) {
                return ApiResponse.error(400, "产品类别不能为空");
            }
            if (request.getNumber() == null) {
                return ApiResponse.error(400, "编号不能为空");
            }
            if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
                return ApiResponse.error(400, "市场不能为空");
            }

            // 4.6 各查询条件格式验证
            // 字段长度校验
            if (request.getVariable() != null && request.getVariable().length() > 20) {
                return ApiResponse.error(400, "Variable长度不能超过20");
            }
            if (request.getValue() != null && request.getValue().length() > 200) {
                return ApiResponse.error(400, "Value长度不能超过200");
            }
            if (request.getVariantString1() != null && request.getVariantString1().length() > 100) {
                return ApiResponse.error(400, "Variant string.1长度不能超过100");
            }
            if (request.getVariantString2() != null && request.getVariantString2().length() > 100) {
                return ApiResponse.error(400, "Variant string.2长度不能超过100");
            }
            if (request.getComments() != null && request.getComments().length() > 200) {
                return ApiResponse.error(400, "Comments长度不能超过200");
            }
            if (request.getCreatedByUser() != null && request.getCreatedByUser().length() > 16) {
                return ApiResponse.error(400, "创建用户长度不能超过16");
            }

            // 4.6 操作符合法性校验（白名单验证，防止SQL注入）
            // 将操作符映射为XML安全的字符串（避免 '<' 在XML属性中导致解析错误）
            String pcOp = mapOperatorForXml(validateOperator(request.getProductClassOperator(), new String[]{"=", "!="}, "="));
            String numOp = mapOperatorForXml(validateOperator(request.getNumberOperator(), new String[]{"=", ">", "<"}, "="));
            String marketOp = mapOperatorForXml(validateOperator(request.getMarketOperator(), new String[]{"=", "!="}, "="));
            String varOp = mapOperatorForXml(validateOperator(request.getVariableOperator(), new String[]{"=", "!="}, "="));
            String valOp = mapOperatorForXml(validateOperator(request.getValueOperator(), new String[]{"=", "!="}, "="));
            String vs1Op = mapOperatorForXml(validateOperator(request.getVariantString1Operator(), new String[]{"=", "!="}, "="));
            String vs2Op = mapOperatorForXml(validateOperator(request.getVariantString2Operator(), new String[]{"=", "!="}, "="));
            String cmtOp = mapOperatorForXml(validateOperator(request.getCommentsOperator(), new String[]{"=", "!="}, "="));
            String addOp = mapOperatorForXml(validateOperator(request.getAddDateOperator(), new String[]{"=", "!="}, "="));
            String delOp = mapOperatorForXml(validateOperator(request.getDeleteDateOperator(), new String[]{"=", "!="}, "="));
            String userOp = mapOperatorForXml(validateOperator(request.getCreatedByUserOperator(), new String[]{"=", "!="}, "="));
            String dateOp = mapOperatorForXml(validateOperator(request.getDateOperator(), new String[]{"=", ">", "<"}, "="));

            // 4.6 对模糊查询参数进行适当的转义处理（仅当操作符为"eq"时使用LIKE模糊查询）
            String variable = (varOp.equals("eq")) ? escapeLikeParam(request.getVariable()) : request.getVariable();
            String value = (valOp.equals("eq")) ? escapeLikeParam(request.getValue()) : request.getValue();
            String variantString1 = (vs1Op.equals("eq")) ? escapeLikeParam(request.getVariantString1()) : request.getVariantString1();
            String variantString2 = (vs2Op.equals("eq")) ? escapeLikeParam(request.getVariantString2()) : request.getVariantString2();
            String comments = (cmtOp.equals("eq")) ? escapeLikeParam(request.getComments()) : request.getComments();
            String addDate = (addOp.equals("eq")) ? escapeLikeParam(request.getAddDate()) : request.getAddDate();
            String deleteDate = (delOp.equals("eq")) ? escapeLikeParam(request.getDeleteDate()) : request.getDeleteDate();
            String createdByUser = (userOp.equals("eq")) ? escapeLikeParam(request.getCreatedByUser()) : request.getCreatedByUser();
            String date = (dateOp.equals("eq")) ? escapeLikeParam(request.getDate()) : request.getDate();

            // 4.5 调用Mapper执行查询（传入各字段值及对应的操作符）
            List<HdocUserDefinedRules> rulesList = hdocUserDefinedRulesMapper.searchUserDefinedRules(
                    request.getProductClass(), pcOp,
                    request.getNumber(), numOp,
                    request.getMarket(), marketOp,
                    variable, varOp,
                    value, valOp,
                    variantString1, vs1Op,
                    variantString2, vs2Op,
                    comments, cmtOp,
                    addDate, addOp,
                    deleteDate, delOp,
                    createdByUser, userOp,
                    date, dateOp
            );

            // 4.6 判断查询结果
            if (rulesList == null || rulesList.isEmpty()) {
                // 4.7 返回空列表
                return ApiResponse.success("搜索用户定义规则成功", rulesList);
            }

            // 4.8 封装响应对象，只返回需要的字段
            List<Map<String, Object>> dataList = rulesList.stream().map(rule -> {
                Map<String, Object> item = new HashMap<>();
                item.put("pc", rule.getPc());
                item.put("num", rule.getNum());
                item.put("market", rule.getMarket());
                item.put("variable", rule.getVariable());
                item.put("val", rule.getVal());
                item.put("vs", rule.getVs());
                item.put("vs2", rule.getVs2());
                item.put("comments", rule.getComments());
                item.put("addDate", rule.getAddDate());
                item.put("deleteDate", rule.getDeleteDate());
                item.put("registerUser", rule.getRegisterUser());
                item.put("registerDatetime", rule.getRegisterDatetime());
                return item;
            }).collect(Collectors.toList());

            return ApiResponse.success("搜索用户定义规则成功", dataList);

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    /**
     * 4.4 批量删除用户定义规则
     * 对每个删除请求进行校验，执行软删除操作
     *
     * @param deleteRequests 删除请求列表
     * @return API响应，包含删除结果统计
     */
    @Override
    public ApiResponse<?> deleteSelectedUserDefinedRules(List<UD09DeleteUserDefinedRulesRequest> deleteRequests) {

        try {
            int deletedCount = 0;
            int failedCount = 0;
            StringBuilder errorMessages = new StringBuilder();

            // 获取当前用户（从前端传入，或使用默认值）
            // 从第一个请求中尝试获取用户信息，这里使用默认值SYSTEM
            String currentUser = "SYSTEM"; // 实际应从安全上下文中获取

            // 获取当前日期时间
            String now = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());

            for (int i = 0; i < deleteRequests.size(); i++) {
                UD09DeleteUserDefinedRulesRequest request = deleteRequests.get(i);

                // 4.4 参数合法性校验
                if (request.getProductClass() == null || request.getProductClass().trim().isEmpty()) {
                    failedCount++;
                    errorMessages.append("第").append(i + 1).append("条记录: 产品类别不能为空; ");
                    continue;
                }
                if (request.getNumber() == null) {
                    failedCount++;
                    errorMessages.append("第").append(i + 1).append("条记录: 编号不能为空; ");
                    continue;
                }
                if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
                    failedCount++;
                    errorMessages.append("第").append(i + 1).append("条记录: 市场不能为空; ");
                    continue;
                }

                // 4.5 检查记录是否存在
                int count = hdocUserDefinedRulesMapper.countByPrimaryKey(
                        request.getProductClass(), request.getNumber(), request.getMarket());

                // 4.6 判断记录是否存在
                if (count == 0) {
                    failedCount++;
                    errorMessages.append("PC=").append(request.getProductClass())
                            .append(", NUM=").append(request.getNumber())
                            .append(", MARKET=").append(request.getMarket())
                            .append(": 记录不存在; ");
                    continue;
                }

                // 4.7 执行软删除操作
                int result = hdocUserDefinedRulesMapper.softDelete(
                        request.getProductClass(),
                        request.getNumber(),
                        request.getMarket(),
                        currentUser
                );

                if (result > 0) {
                    deletedCount++;
                } else {
                    failedCount++;
                    errorMessages.append("PC=").append(request.getProductClass())
                            .append(", NUM=").append(request.getNumber())
                            .append(", MARKET=").append(request.getMarket())
                            .append(": 删除失败; ");
                }
            }

            // 4.8 构建响应数据
            Map<String, Object> data = new HashMap<>();
            data.put("deletedCount", deletedCount);
            data.put("failedCount", failedCount);

            if (failedCount == 0) {
                return ApiResponse.success("删除用户定义规则成功", data);
            } else if (deletedCount > 0) {
                return ApiResponse.success(
                        deletedCount + "条记录删除成功，" + failedCount + "条记录删除失败",
                        data);
            } else {
                return ApiResponse.error(500, "删除失败: " + errorMessages.toString());
            }

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    /**
     * 对模糊查询参数进行转义处理，防止SQL注入
     * 转义 LIKE 查询中的特殊字符 % 和 _
     *
     * @param param 原始参数
     * @return 转义后的参数，如果为空则返回null
     */
    private String escapeLikeParam(String param) {
        if (param == null || param.trim().isEmpty()) {
            return null;
        }
        // 转义 % 和 _ 字符
        return param.trim()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    /**
     * 校验操作符是否在白名单中，若不在则返回默认值
     * 防止SQL注入：只允许白名单中的操作符通过
     *
     * @param operator   操作符
     * @param whitelist  白名单
     * @param defaultOp  默认值
     * @return 校验通过的操作符
     */
    private String validateOperator(String operator, String[] whitelist, String defaultOp) {
        if (operator == null || operator.trim().isEmpty()) {
            return defaultOp;
        }
        String trimmed = operator.trim();
        for (String allowed : whitelist) {
            if (allowed.equals(trimmed)) {
                return trimmed;
            }
        }
        return defaultOp;
    }

    /**
     * 将操作符映射为XML安全的字符串
     * 避免 '<' 和 '>' 等特殊字符出现在MyBatis XML的test属性中导致解析失败
     *
     * @param operator 原始操作符（=, !=, >, <）
     * @return XML安全的操作符标识（eq, ne, gt, lt）
     */
    private String mapOperatorForXml(String operator) {
        if (operator == null) {
            return "eq";
        }
        switch (operator) {
            case "=":  return "eq";
            case "!=": return "ne";
            case ">":  return "gt";
            case "<":  return "lt";
            default:   return "eq";
        }
    }
}
