package com.web.app.service.impl;

import com.web.app.mapper.HDocSendDataVinPlateMapper;
import com.web.app.service.UD15SendDataService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UD15SendDataServiceImpl implements UD15SendDataService {

  @Autowired
  private HDocSendDataVinPlateMapper mapper;

  @Override
  public Map<String, Object> viewInfo(String serie, String chnr) {
    return mapper.selectVinPlateInfo(serie, chnr);
  }

  private String resolveUser(String updateUser) {
    return (updateUser != null && !updateUser.trim().isEmpty()) ? updateUser.trim() : "SYSTEM";
  }

  @Override
  public int setRegenerate(String serie, String chnr, String updateUser) {
    return mapper.updateStatus(
        serie, chnr, "0", null, "UD15SetRegenerate", resolveUser(updateUser));
  }

  @Override
  public int setOK(String serie, String chnr, String updateUser) {
    return mapper.updateStatus(serie, chnr, "1", null, "UD15SetOK", resolveUser(updateUser));
  }

  @Override
  public int changeToBasicInfo(String serie, String chnr, String updateUser) {
    return mapper.updateStatusAndType(
        serie, chnr, "0", "1", "UD15ChangetoBasicInfo", resolveUser(updateUser));
  }

  @Override
  public int changeToAdvancedInfo(String serie, String chnr, String updateUser) {
    return mapper.updateStatusAndType(
        serie, chnr, "0", "2", "UD15ChangetoAdvancedInfo", resolveUser(updateUser));
  }
}
