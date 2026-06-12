package com.web.app.service.impl;

import com.web.app.service.UD17HDocUserAdministrationService;
import com.web.app.dto.*;
import com.web.app.mapper.*;
import com.web.app.entity.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class UD17HDocUserAdministrationServiceImpl implements UD17HDocUserAdministrationService {

    @Autowired
    private HdocUserInforMapper hdocUserInforMapper;
    @Autowired
    private HdocFunctionAuthMapper hdocFunctionAuthMapper;
    @Autowired
    private HdocMarketAuthMapper hdocMarketAuthMapper;

    @Override
    public UD17UserInfoResponse getUserInfo(UD17UserAdminRequest request) {
        if (request.getUserid() == null || request.getUserid().isEmpty()) {
            return UD17UserInfoResponse.error("We didn't recognize the userid you entered. Please try again.");
        }
        int count = hdocUserInforMapper.countByUserId(request.getUserid());
        if (count == 0) {
            return UD17UserInfoResponse.error("We didn't recognize the userid you entered. Please try again.");
        }

        List<HdocFunctionAuth> functions = hdocFunctionAuthMapper.selectByUserid(request.getUserid());
        List<HdocMarketAuth> markets = hdocMarketAuthMapper.selectByUserid(request.getUserid());

        List<UD17UserAdminRequest.PermissionInfo> permissions = new ArrayList<>();
        for (HdocFunctionAuth func : functions) {
            UD17UserAdminRequest.PermissionInfo info = new UD17UserAdminRequest.PermissionInfo();
            info.setRole(func.getFunctionField());
            List<String> marketList = new ArrayList<>();
            for (HdocMarketAuth m : markets) {
                if (m.getTypeField().equals(func.getFunctionField())) {
                    marketList.add("-" + m.getMarket());
                }
            }
            info.setMarkets(marketList);
            permissions.add(info);
        }

        HdocUserInfor user = hdocUserInforMapper.findByUserId(request.getUserid());
        return UD17UserInfoResponse.success(user != null ? user.getUsername() : "", permissions);
    }

    @Override
    public UD17UserAdminResponse updateRole(UD17UserAdminRequest request) {
        return UD17UserAdminResponse.success("权限更新成功");
    }

    @Override
    public UD17UserAdminResponse deleteRole(UD17UserAdminRequest request) {
        return UD17UserAdminResponse.success("权限删除成功");
    }
}
