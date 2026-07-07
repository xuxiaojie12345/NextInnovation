package com.web.app.service;

import java.util.List;
import java.util.Map;

public interface UD20Service {
    List<Map<String, Object>> getDocumentList(String documentType);
}
