package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocDocumentList;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD18Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * UD18 Service Implementation
 * 实现HDoc用户文档权限管理的业务逻辑
 */
@Slf4j
@Service
public class UD18ServiceImpl implements UD18Service {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public ApiResponse<?> getDocumentList() {
        log.info("========== UD18 Service: Get Document List ==========");

        try {
            List<Map<String, String>> documentList = hdocDocumentListMapper.selectDocumentList();

            if (documentList == null || documentList.isEmpty()) {
                log.warn("Document list is empty");
                return ApiResponse.error(404, "文档列表为空");
            }

            log.info("Document list size: {}", documentList.size());
            return ApiResponse.success("获取文档列表成功", documentList);

        } catch (Exception e) {
            log.error("Error getting document list", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> getUserFunctionsAndDocuments(HdocDocumentList request) {
        log.info("========== UD18 Service: Get User Functions And Documents ==========");
        log.info("userId: {}", request.getUserId());

        try {
            String userId = request.getUserId() != null ? request.getUserId().trim() : "";

            // 参数校验
            if (userId.isEmpty()) {
                return ApiResponse.error(400, "UserId不能为空");
            }

            if (userId.length() > 20) {
                return ApiResponse.error(400, "UserId长度不能超过20字符");
            }

            // 判断用户是否存在
            int userCount = hdocDocumentListMapper.countUserById(userId);
            if (userCount == 0) {
                log.warn("User not found: userId={}", userId);
                return ApiResponse.error(404, "We didn't recognize the userid you entered. Please try again.");
            }

            // 查询功能权限
            List<Map<String, String>> functions = hdocDocumentListMapper.selectFunctionAuth(userId);
            if (functions == null) {
                functions = new ArrayList<>();
            }

            // 查询文档权限
            List<Map<String, String>> documents = hdocDocumentListMapper.selectUserDocAuth(userId);
            if (documents == null) {
                documents = new ArrayList<>();
            }

            // 查询用户名
            String username = "";
            com.web.app.domain.Entity.UserInfo userInfo = hdocDocumentListMapper.selectUserInfo(userId, null);
            if (userInfo != null) {
                username = userInfo.getUsername();
            }

            // 构建返回数据
            Map<String, Object> data = new HashMap<>();
            data.put("username", username);
            data.put("functions", functions);
            data.put("documents", documents);

            log.info("User functions and documents found: {} functions, {} documents", functions.size(), documents.size());
            return ApiResponse.success("获取用户功能和文档权限成功", data);

        } catch (Exception e) {
            log.error("Error getting user functions and documents", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> updateUserDocuments(HdocDocumentList request) {
        log.info("========== UD18 Service: Update User Documents ==========");
        log.info("userId: {}, documentTypes: {}", request.getUserId(), request.getDocumentTypes());

        try {
            String userId = request.getUserId() != null ? request.getUserId().trim() : "";
            List<String> documentTypes = request.getDocumentTypes();

            // 参数校验
            if (userId.isEmpty()) {
                return ApiResponse.error(400, "UserId不能为空");
            }

            if (userId.length() > 20) {
                return ApiResponse.error(400, "UserId长度不能超过20字符");
            }

            if (documentTypes == null) {
                documentTypes = new ArrayList<>();
            }

            // 判断用户是否存在
            int userCount = hdocDocumentListMapper.countUserById(userId);
            if (userCount == 0) {
                log.warn("User not found: userId={}", userId);
                return ApiResponse.error(404, "We didn't recognize the userid you entered. Please try again.");
            }

            // 获取当前操作用户
            String currentUser = request.getUpdateUser() != null && !request.getUpdateUser().trim().isEmpty()
                    ? request.getUpdateUser().trim() : "SYSTEM";
            String process = "UD18_UPDATE_USER_DOC";

            // Step1: 先删除该用户所有现有文档权限
            int deletedCount = hdocDocumentListMapper.deleteAllUserDocAuth(userId);
            log.info("Deleted all existing document auth for user {}: {} records", userId, deletedCount);

            // Step2: 再插入新的文档权限
            int insertedCount = 0;
            for (String docType : documentTypes) {
                if (docType != null && !docType.trim().isEmpty()) {
                    hdocDocumentListMapper.insertUserDocAuth(userId, docType.trim(), currentUser, process, currentUser, process);
                    insertedCount++;
                    log.info("Inserted document auth: userId={}, doctype={}", userId, docType);
                }
            }

            // 构建返回数据
            Map<String, Object> data = new HashMap<>();
            data.put("userid", userId);
            data.put("documentTypes", documentTypes);

            log.info("User documents updated successfully for user: {}", userId);
            return ApiResponse.success("更新用户文档权限成功", data);

        } catch (Exception e) {
            log.error("Error updating user documents", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
}
