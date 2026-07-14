package com.web.app.service;

import java.util.List;
import java.util.Map;

public interface SaveModificationsService {
  List<Map<String, Object>> selectModificationData(String serie, String chno);
}
