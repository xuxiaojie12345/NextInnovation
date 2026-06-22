package com.web.app.service;

import java.util.List;
import java.util.Map;

public interface UserAdminService {
    Map<String, Object> getUserAuthList(String userid);
    int updateUserRole(String userid, List<Map<String, String>> authList);
    void deleteUserRole(String userid);
}
