package com.web.app.service;

import com.web.app.domain.UD17Request;
import java.util.List;
import java.util.Map;

/**

 * UD17Service

 */

public interface UD17Service {
    List<Map<String, String>> getMarkets();
    Map<String, Object> processUserAdmin(UD17Request request);
}
