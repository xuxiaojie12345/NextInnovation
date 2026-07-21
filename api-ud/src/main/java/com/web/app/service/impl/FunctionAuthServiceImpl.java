package com.web.app.service.impl;

import com.web.app.dto.response.PermissionResponse;
import com.web.app.entity.HdocFunctionAuth;
import com.web.app.mapper.HdocFunctionAuthMapper;
import com.web.app.service.FunctionAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FunctionAuthServiceImpl implements FunctionAuthService {

    @Autowired
    private HdocFunctionAuthMapper hdocFunctionAuthMapper;

    @Override
    public PermissionResponse getUserFunctionAuth(String userId) {
        List<String> codes = getUserFunctionCodes(userId);
        return new PermissionResponse(codes);
    }

    @Override
    public List<String> getUserFunctionCodes(String userId) {
        List<HdocFunctionAuth> list = hdocFunctionAuthMapper.selectByUserId(userId);
        return list.stream().map(HdocFunctionAuth::getFunction).collect(Collectors.toList());
    }
}
