package com.web.app.service;

import java.util.List;

public interface UserDocService {
    void updateUserDoc(String userid, List<String> doctypeList);
    int selectFunctionAuthCount(String userid);
    List<String> selectUserDoc(String userid);
}
