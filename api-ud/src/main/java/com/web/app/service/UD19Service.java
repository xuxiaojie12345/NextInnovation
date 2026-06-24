package com.web.app.service;

import com.web.app.domain.UD19Request;
import java.util.Map;

public interface UD19Service {
    Map<String, Object> searchUser(UD19Request request);
}
