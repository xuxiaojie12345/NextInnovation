package com.web.app.service.impl;

import com.web.app.mapper.UserDocMapper;
import com.web.app.service.UserDocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserDocServiceImpl implements UserDocService {

    @Autowired
    private UserDocMapper userDocMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateUserDoc(String userid, List<String> doctypeList) {
        // Delete existing records for the user
        userDocMapper.deleteUserDoc(userid);
        // Insert new records
        String currentUser = "SYSTEM";
        for (String doctype : doctypeList) {
            userDocMapper.insertUserDoc(userid, doctype, currentUser);
        }
    }

    @Override
    public int deleteUserDoc(String userid) {
        return userDocMapper.deleteUserDoc(userid);
    }

    @Override
    public int createUserDoc(String userid, String doctype, String currentUser) {
        return userDocMapper.insertUserDoc(userid, doctype, currentUser);
    }

    @Override
    public int selectFunctionAuthCount(String userid) {
        return userDocMapper.selectFunctionAuthCount(userid);
    }

    @Override
    public List<String> selectUserDoc(String userid) {
        return userDocMapper.selectUserDoc(userid);
    }
}
