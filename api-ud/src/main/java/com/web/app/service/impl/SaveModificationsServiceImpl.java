package com.web.app.service.impl;

import com.web.app.mapper.SaveModificationsMapper;
import com.web.app.service.SaveModificationsService;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SaveModificationsServiceImpl implements SaveModificationsService {

  @Autowired
  private SaveModificationsMapper saveModificationsMapper;

  @Override
  public List<Map<String, Object>> selectModificationData(String serie, String chno) {
    return saveModificationsMapper.selectModificationData(serie, chno);
  }
}
