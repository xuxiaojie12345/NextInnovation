package com.web.app.service;

import java.util.List;
import java.util.Map;

public interface UD20DocumentService {
  List<Map<String, Object>> getDocumentList(Map<String, String> params);

  int updateDocumentList(Map<String, String> params);
}
