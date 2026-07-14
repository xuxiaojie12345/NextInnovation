package com.web.app.service.impl;

import com.web.app.mapper.ModifyDocumentMapper;
import com.web.app.service.ModifyDocumentService;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ModifyDocumentServiceImpl implements ModifyDocumentService {

  @Autowired
  private ModifyDocumentMapper mapper;

  @Override
  public List<Map<String, Object>> selectModifications(String serie, String chnr) {
    return mapper.selectModifications(serie, chnr);
  }

  @Override
  public int updateModifications(
      String serie, String chnr, List<Map<String, String>> modifications, String currentUser) {
    int count = 0;
    String user = (currentUser != null && !currentUser.isEmpty()) ? currentUser : "SYSTEM";
    for (Map<String, String> mod : modifications) {
      String variable = mod.get("variable");
      String val = mod.get("val");
      if (variable != null && val != null) {
        int rows = mapper.updateModificationValue(serie, chnr, variable, val, user);
        count += rows;
      }
    }
    return count;
  }
}
