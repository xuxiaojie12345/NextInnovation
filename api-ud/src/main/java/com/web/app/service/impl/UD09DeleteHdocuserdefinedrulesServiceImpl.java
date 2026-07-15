package com.web.app.service.impl;

import com.web.app.dto.UD09DeleteHdocuserdefinedrulesRequest;
import com.web.app.dto.UD09DeleteHdocuserdefinedrulesResponse;
import com.web.app.dto.UD09DeleteHdocuserdefinedrulesResponse.UserDefinedRuleData;
import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.mapper.UD09DeleteHdocuserdefinedrulesMapper;
import com.web.app.service.UD09DeleteHdocuserdefinedrulesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * UD09 删除用户定义规则服务实现类
 *
 * 功能说明：实现用户定义规则的搜索和批量删除业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD09DeleteHdocuserdefinedrulesServiceImpl implements UD09DeleteHdocuserdefinedrulesService {

    @Autowired
    private UD09DeleteHdocuserdefinedrulesMapper ud09Mapper;

    @Override
    public UD09DeleteHdocuserdefinedrulesResponse UD09Seach(UD09DeleteHdocuserdefinedrulesRequest request) {
        try {
            List<HdocUserDefinedRules> ruleList = ud09Mapper.searchUserDefinedRules(request);

            if (ruleList == null || ruleList.isEmpty()) {
                return UD09DeleteHdocuserdefinedrulesResponse.error(404, "数据不存在");
            }

            List<UserDefinedRuleData> dataList = new ArrayList<>();
            for (HdocUserDefinedRules rule : ruleList) {
                UserDefinedRuleData data = new UserDefinedRuleData();
                data.setProductClass(rule.getPc());
                data.setNumber(rule.getNum());
                data.setMarket(rule.getMarket());
                data.setVariable(rule.getVariable());
                data.setValue(rule.getVal());
                data.setVariantString1(rule.getVs());
                data.setVariantString2(rule.getVs2());
                data.setComments(rule.getComments());
                data.setAddDate(rule.getAddDate());
                data.setDeleteDate(rule.getDeleteDate());
                data.setCreatedByUser(rule.getRegisterUser());
                data.setDate(rule.getRegisterDatetime() != null ? rule.getRegisterDatetime().toString() : null);
                dataList.add(data);
            }

            return UD09DeleteHdocuserdefinedrulesResponse.success("", dataList);
        } catch (Exception e) {
            return UD09DeleteHdocuserdefinedrulesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD09DeleteHdocuserdefinedrulesResponse UD09DeleteSelected(UD09DeleteHdocuserdefinedrulesRequest request) {
        try {
            // 校验必填参数
            if (request.getProductClass() == null || request.getProductClass().trim().isEmpty()
                    || request.getNumber() == null
                    || request.getMarket() == null || request.getMarket().trim().isEmpty()) {
                return UD09DeleteHdocuserdefinedrulesResponse.error(400, "参数productClass、number、market不能为空");
            }

            // 检查数据是否存在
            Integer count = ud09Mapper.countUserDefinedRule(
                    request.getProductClass(), request.getNumber(), request.getMarket());
            if (count == null || count == 0) {
                return UD09DeleteHdocuserdefinedrulesResponse.error(400, "数据不存在");
            }

            // 执行删除
            ud09Mapper.deleteUserDefinedRule(request.getProductClass(), request.getNumber(), request.getMarket());

            return UD09DeleteHdocuserdefinedrulesResponse.success("", null);
        } catch (Exception e) {
            return UD09DeleteHdocuserdefinedrulesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
