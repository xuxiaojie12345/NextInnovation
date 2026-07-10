package com.web.app.service;

import java.util.List;
import java.util.Map;

public interface ModifyDocumentService {
  List<Map<String, Object>> selectModifications(String serie, String chnr);

  int updateModifications(String serie, String chnr, List<Map<String, String>> modifications);
}
