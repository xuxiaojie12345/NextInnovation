package com.web.app.service.impl;

import com.web.app.domain.UD18Request;
import com.web.app.mapper.UD18Mapper;
import com.web.app.service.UD18Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UD18ServiceImpl implements UD18Service {

    private static final Logger logger = LoggerFactory.getLogger(UD18ServiceImpl.class);

    @Autowired
    private UD18Mapper ud18Mapper;

    @Override
    public Map<String, Object> processUserDoc(UD18Request request) {
        String userId = request.getUserid().trim();
        switch (request.getOperation()) {
            case "checkAuth":
                return handleCheckAuth(userId);
            case "select":
                return handleSelect(userId);
            case "delete":
                return handleDelete(userId);
            case "create":
                return handleCreate(userId, request.getDoctypes());
            default:
                throw new IllegalArgumentException("Unknown operation: " + request.getOperation());
        }
    }

    private Map<String, Object> handleCheckAuth(String userId) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<String> functions = ud18Mapper.selectFunctionAuth(userId);
        if (functions != null && !functions.isEmpty()) {
            result.put("exists", true);
            result.put("functions", functions);
        } else {
            result.put("exists", false);
            result.put("message", "User not found");
        }
        return result;
    }

    private Map<String, Object> handleSelect(String userId) {
        Map<String, Object> result = new LinkedHashMap<>();
        String username = ud18Mapper.selectUsername(userId);
        result.put("username", username != null ? username : "");
        List<String> doctypes = ud18Mapper.selectUserDoc(userId);
        result.put("doctypes", doctypes != null ? doctypes : new ArrayList<>());
        return result;
    }

    private Map<String, Object> handleDelete(String userId) {
        ud18Mapper.deleteUserDoc(userId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", "Document permissions deleted successfully.");
        return result;
    }

    private Map<String, Object> handleCreate(String userId, List<String> doctypes) {
        // 先删后增
        ud18Mapper.deleteUserDoc(userId);
        if (doctypes != null) {
            for (String doctype : doctypes) {
                ud18Mapper.insertUserDoc(userId, doctype);
            }
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", "Document permissions created successfully.");
        return result;
    }
}
