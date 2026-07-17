package com.web.app.service.impl;

import com.web.app.dto.UD08HomologationVariablesRequest;
import com.web.app.dto.UD08HomologationVariablesResponse;
import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.entity.MarketMaster;
import com.web.app.entity.ProductClassMaster;
import com.web.app.mapper.UD08HomologationVariablesMapper;
import com.web.app.service.UD08HomologationVariablesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD08 认证变量规则服务实现类
 *
 * 功能说明：实现认证变量规则的业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD08HomologationVariablesServiceImpl implements UD08HomologationVariablesService {

    @Autowired
    private UD08HomologationVariablesMapper ud08Mapper;

    @Override
    public UD08HomologationVariablesResponse UD08SelectProductclassmaster() {
        try {
            List<ProductClassMaster> list = ud08Mapper.selectAllProductClass();
            List<UD08HomologationVariablesResponse.ProductClassData> dataList = new ArrayList<>();
            if (list != null) {
                for (ProductClassMaster pcm : list) {
                    dataList.add(new UD08HomologationVariablesResponse.ProductClassData(pcm.getPc()));
                }
            }
            return UD08HomologationVariablesResponse.success("查询成功", dataList);
        } catch (Exception e) {
            return UD08HomologationVariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD08HomologationVariablesResponse UD08SelectMarketmaster() {
        try {
            List<MarketMaster> list = ud08Mapper.selectAllMarket();
            List<UD08HomologationVariablesResponse.MarketData> dataList = new ArrayList<>();
            if (list != null) {
                for (MarketMaster mm : list) {
                    dataList.add(new UD08HomologationVariablesResponse.MarketData(mm.getMarket()));
                }
            }
            return UD08HomologationVariablesResponse.success("查询成功", dataList);
        } catch (Exception e) {
            return UD08HomologationVariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD08HomologationVariablesResponse UD08SelectHdocvariables(UD08HomologationVariablesRequest request) {
        try {
            if (request.getVariables() == null || request.getVariables().trim().isEmpty()) {
                return UD08HomologationVariablesResponse.error(400, "参数variables不能为空");
            }
            Integer count = ud08Mapper.countHdocVariables(request.getVariables().trim());
            boolean exists = count != null && count > 0;
            Map<String, Boolean> data = new HashMap<>();
            data.put("exists", exists);
            String msg = exists ? "数据存在" : "数据不存在";
            return UD08HomologationVariablesResponse.success(msg, data);
        } catch (Exception e) {
            return UD08HomologationVariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD08HomologationVariablesResponse UD08Add(UD08HomologationVariablesRequest request) {
        try {
            // 校验必填参数
            String validationError = validateRequiredPk(request);
            if (validationError != null) {
                return UD08HomologationVariablesResponse.error(400, validationError);
            }

            // 检查是否已存在（PC + NUM + MARKET 组合）
            Integer count = ud08Mapper.countUserDefinedRule(
                    request.getProductClass(), request.getNumber(), request.getMarket());
            if (count != null && count > 0) {
                return UD08HomologationVariablesResponse.error(409,
                        "Primary key conflict, Please enter the correct content");
            }

            // 构建实体并插入
            HdocUserDefinedRules rule = buildRuleFromRequest(request);
            ud08Mapper.insertUserDefinedRule(rule);

            return UD08HomologationVariablesResponse.success("数据添加成功", "");
        } catch (Exception e) {
            return UD08HomologationVariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD08HomologationVariablesResponse UD08Update(UD08HomologationVariablesRequest request) {
        try {
            // 校验必填参数
            String validationError = validateRequiredPk(request);
            if (validationError != null) {
                return UD08HomologationVariablesResponse.error(400, validationError);
            }

            // 判断主键是否被更改（从UD09选择记录后，只要主键被改就报冲突）
            // 若三个原始主键值都为空（Clear后），则跳过主键冲突检查
            boolean pkChanged = false;
            boolean hasOriginalPk = (request.getOriginalProductClass() != null
                    && !request.getOriginalProductClass().isEmpty())
                    || request.getOriginalNumber() != null
                    || (request.getOriginalMarket() != null && !request.getOriginalMarket().isEmpty());
            if (hasOriginalPk) {
                String origPc = request.getOriginalProductClass() != null ? request.getOriginalProductClass() : "";
                String origNum = request.getOriginalNumber() != null ? String.valueOf(request.getOriginalNumber()) : "";
                String origMkt = request.getOriginalMarket() != null ? request.getOriginalMarket() : "";
                String curPc = request.getProductClass();
                String curNum = String.valueOf(request.getNumber());
                String curMkt = request.getMarket();
                pkChanged = !origPc.equals(curPc) || !origNum.equals(curNum) || !origMkt.equals(curMkt);
            }

            if (pkChanged) {
                return UD08HomologationVariablesResponse.error(409,
                        "Primary key conflict, Please enter the correct content");
            }

            // 检查数据是否存在
            Integer count = ud08Mapper.countUserDefinedRule(
                    request.getProductClass(), request.getNumber(), request.getMarket());
            if (count == null || count == 0) {
                return UD08HomologationVariablesResponse.error(404,
                        "Data does not exist, Please enter the correct content");
            }

            // 构建实体并更新
            HdocUserDefinedRules rule = buildRuleFromRequest(request);
            ud08Mapper.updateUserDefinedRule(rule);

            return UD08HomologationVariablesResponse.success("数据更新成功", null);
        } catch (Exception e) {
            return UD08HomologationVariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD08HomologationVariablesResponse UD08Delete(UD08HomologationVariablesRequest request) {
        try {
            String validationError = validateRequiredPk(request);
            if (validationError != null) {
                return UD08HomologationVariablesResponse.error(400, validationError);
            }

            // 检查数据是否存在
            Integer count = ud08Mapper.countUserDefinedRule(
                    request.getProductClass(), request.getNumber(), request.getMarket());
            if (count == null || count == 0) {
                return UD08HomologationVariablesResponse.error(404,
                        "Data does not exist, Please enter the correct content");
            }

            // 删除数据
            ud08Mapper.deleteUserDefinedRule(request.getProductClass(), request.getNumber(), request.getMarket());

            return UD08HomologationVariablesResponse.success("数据删除成功", null);
        } catch (Exception e) {
            return UD08HomologationVariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    // ==================== 私有方法 ====================

    private String validateRequiredPk(UD08HomologationVariablesRequest request) {
        if (request.getProductClass() == null || request.getProductClass().trim().isEmpty()) {
            return "productClass不能为空";
        }
        if (request.getNumber() == null) {
            return "number不能为空";
        }
        if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
            return "market不能为空";
        }
        return null;
    }

    private HdocUserDefinedRules buildRuleFromRequest(UD08HomologationVariablesRequest request) {
        HdocUserDefinedRules rule = new HdocUserDefinedRules();
        rule.setPc(request.getProductClass());
        rule.setNum(request.getNumber().longValue());
        rule.setMarket(request.getMarket());
        rule.setVariable(request.getVariable());
        rule.setVal(request.getValue());
        rule.setVs(request.getVariantString1());
        rule.setVs2(request.getVariantString2());
        rule.setComments(request.getComments());
        rule.setAddDate(request.getAddDate());
        rule.setDeleteDate(request.getDeleteDate());
        rule.setUserid(request.getCreatedByUser());
        rule.setRegisterUser(request.getCreatedByUser());
        rule.setUpdateUser(request.getCreatedByUser());
        rule.setRegisterProcess("UD08");
        rule.setUpdateProcess("UD08");
        return rule;
    }
}
