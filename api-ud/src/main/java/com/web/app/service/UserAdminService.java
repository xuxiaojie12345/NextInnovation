package com.web.app.service;

import com.web.app.dto.response.*;
import com.web.app.dto.request.*;
import java.util.List;

public interface UserAdminService {
    UserInfoResponse getUserInfo(String userId);
    void updateUserRole(String userId, List<String> roles);
    void deleteUserRole(String userId);
    HdocFunctionAuthResponse checkFunctionAuth(String userId);
    HdocUserDocResponse getUserDoc(String userId);
    void deleteUserDoc(String userId);
    void createUserDoc(String userId, List<String> doctypes);
    SearchResultResponse<UserSearchRecord> searchHdocUsers(UD19SearchHdocRequest request);
}
