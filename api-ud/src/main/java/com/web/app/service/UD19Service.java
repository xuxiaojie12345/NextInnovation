package com.web.app.service;

import java.util.List;
import java.util.Map;

public interface UD19Service {
    List<String> selectAllMarkets();
    List<Map<String, Object>> searchHdoc(String userid, String user, String market, String check);
}
