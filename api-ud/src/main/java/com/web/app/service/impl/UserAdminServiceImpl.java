package com.web.app.service.impl;

import com.web.app.dto.response.*;
import com.web.app.dto.request.*;
import com.web.app.entity.*;
import com.web.app.exception.BusinessException;
import com.web.app.mapper.*;
import com.web.app.service.UserAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserAdminServiceImpl implements UserAdminService {

    @Autowired
    private UserInfoMapper userInfoMapper;
    @Autowired
    private HdocFunctionAuthMapper hdocFunctionAuthMapper;
    @Autowired
    private HdocMarketAuthMapper hdocMarketAuthMapper;
    @Autowired
    private HdocUserDocMapper hdocUserDocMapper;

    @Override
    public UserInfoResponse getUserInfo(String userId) {
        UserInfo user = userInfoMapper.selectByUserId(userId);
        if (user == null) {
            throw new BusinessException(404, "User not found");
        }
        List<HdocFunctionAuth> auths = hdocFunctionAuthMapper.selectByUserId(userId);
        String role = auths.stream().map(HdocFunctionAuth::getFunction).collect(Collectors.joining(","));
        UserInfoResponse resp = new UserInfoResponse();
        resp.setUserId(user.getUserid());
        resp.setUserName(user.getUsername());
        resp.setRole(role);
        resp.setEmail(user.getEMail());
        resp.setResponsible(user.getResponsible());
        resp.setUserPosition(user.getUserposition());
        return resp;
    }

    @Override
    @Transactional
    public void updateUserRole(String userId, List<String> roles) {
        hdocFunctionAuthMapper.deleteByUserId(userId);
        List<HdocFunctionAuth> auths = roles.stream().map(r -> {
            HdocFunctionAuth a = new HdocFunctionAuth();
            a.setUserid(userId);
            a.setFunction(r);
            return a;
        }).collect(Collectors.toList());
        if (!auths.isEmpty()) {
            hdocFunctionAuthMapper.insertBatch(auths);
        }
    }

    @Override
    @Transactional
    public void deleteUserRole(String userId) {
        hdocFunctionAuthMapper.deleteByUserId(userId);
    }

    @Override
    public HdocFunctionAuthResponse checkFunctionAuth(String userId) {
        int count = hdocFunctionAuthMapper.countByUserId(userId);
        HdocFunctionAuthResponse resp = new HdocFunctionAuthResponse();
        resp.setExists(count > 0);
        resp.setUserId(userId);
        return resp;
    }

    @Override
    public HdocUserDocResponse getUserDoc(String userId) {
        List<HdocUserDoc> list = hdocUserDocMapper.selectByUserId(userId);
        List<String> doctypes = list.stream().map(HdocUserDoc::getDoctype).collect(Collectors.toList());
        HdocUserDocResponse resp = new HdocUserDocResponse();
        resp.setUserId(userId);
        resp.setDoctypes(doctypes);
        return resp;
    }

    @Override
    @Transactional
    public void deleteUserDoc(String userId) {
        hdocUserDocMapper.deleteByUserId(userId);
    }

    @Override
    @Transactional
    public void createUserDoc(String userId, List<String> doctypes) {
        List<HdocUserDoc> list = doctypes.stream().map(d -> {
            HdocUserDoc doc = new HdocUserDoc();
            doc.setUserid(userId);
            doc.setDoctype(d);
            return doc;
        }).collect(Collectors.toList());
        hdocUserDocMapper.insertBatch(list);
    }

    @Override
    public SearchResultResponse<UserSearchRecord> searchHdocUsers(UD19SearchHdocRequest request) {
        List<UserInfo> users = userInfoMapper.selectByCondition(
            request.getUserId(), request.getUserName(), request.getMarket());
        List<UserSearchRecord> records = users.stream().map(u -> {
            UserSearchRecord rec = new UserSearchRecord();
            rec.setUserId(u.getUserid());
            rec.setUserName(u.getUsername());
            rec.setMarket(u.getMarket());
            rec.setTotalCount(users.size());
            return rec;
        }).collect(Collectors.toList());
        return new SearchResultResponse<>(records.size(), records);
    }
}
