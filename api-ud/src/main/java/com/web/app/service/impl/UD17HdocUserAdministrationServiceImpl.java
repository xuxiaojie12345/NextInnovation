package com.web.app.service.impl;

import com.web.app.dto.UpdateRoleRequest;
import com.web.app.dto.UserInfoResponse;
import com.web.app.entity.HdocFunctionAuth;
import com.web.app.entity.HdocMarketAuth;
import com.web.app.mapper.HdocFunctionAuthMapper;
import com.web.app.mapper.HdocMarketAuthMapper;
import com.web.app.service.UD17HdocUserAdministrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class UD17HdocUserAdministrationServiceImpl implements UD17HdocUserAdministrationService {

    @Autowired
    private HdocMarketAuthMapper hdocMarketAuthMapper;
    
    @Autowired
    private HdocFunctionAuthMapper hdocFunctionAuthMapper;

    @Override
    public List<UserInfoResponse> getUserInfo(String userId) {
        List<UserInfoResponse> list = hdocMarketAuthMapper.selectUserAuthByUserId(userId);
        if (list == null || list.isEmpty()) {
            throw new RuntimeException("用户信息获取失败");
        }
        return list;
    }

    @Override
    @Transactional
    public void updateRole(String userId, String updateUser, String updateProcess,
                           List<UpdateRoleRequest.MarketAuthItem> marketAuthList,
                           List<UpdateRoleRequest.FunctionAuthItem> functionAuthList) {
        LocalDateTime now = LocalDateTime.now();
        
        // 步骤1：删除该用户的所有旧权限数据
        hdocMarketAuthMapper.deleteMarketAuthByUserId(userId);
        hdocMarketAuthMapper.deleteFunctionAuthByUserId(userId);
        
        // 步骤2：插入HDOC_MARKET_AUTH（每个type+market一条记录）
        if (marketAuthList != null) {
            for (UpdateRoleRequest.MarketAuthItem item : marketAuthList) {
                if (item.getType() == null || item.getType().isEmpty()) continue;
                HdocMarketAuth record = new HdocMarketAuth();
                record.setUserid(userId);
                record.setType(item.getType());
                record.setMarket(item.getMarket() != null ? item.getMarket() : "-EU");
                record.setBu("UD");
                record.setRegisterDatetime(now);
                record.setRegisterUser(updateUser);
                record.setRegisterProcess(updateProcess);
                record.setUpdateDatetime(now);
                record.setUpdateUser(updateUser);
                record.setUpdateProcess(updateProcess);
                hdocMarketAuthMapper.insertMarketAuth(record);
            }
        }
        
        // 步骤3：插入HDOC_FUNCTION_AUTH（每个function一条记录）
        if (functionAuthList != null) {
            for (UpdateRoleRequest.FunctionAuthItem item : functionAuthList) {
                if (item.getFunction() == null || item.getFunction().isEmpty()) continue;
                HdocFunctionAuth record = new HdocFunctionAuth();
                record.setUserid(userId);
                record.setFunction(item.getFunction());
                record.setRegisterDatetime(now);
                record.setRegisterUser(updateUser);
                record.setRegisterProcess(updateProcess);
                record.setUpdateDatetime(now);
                record.setUpdateUser(updateUser);
                record.setUpdateProcess(updateProcess);
                hdocFunctionAuthMapper.insertFunctionAuth(record);
            }
        }
    }

    @Override
    public void deleteRole(String userId) {
        hdocMarketAuthMapper.deleteMarketAuthByUserId(userId);
        hdocMarketAuthMapper.deleteFunctionAuthByUserId(userId);
    }
}
