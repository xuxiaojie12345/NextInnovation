package com.web.app.service.impl;

import com.web.app.mapper.UD14SearchMapper;
import com.web.app.service.UD14SearchService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UD14SearchServiceImpl implements UD14SearchService {

  @Autowired
  private UD14SearchMapper ud14SearchMapper;

  @Override
  public List<String> selectAllMarkets() {
    return ud14SearchMapper.selectAllMarketCodes();
  }

  @Override
  public List<String> selectVariablesByMarketAndFile(String market, String filename) {
    String val = market + "/" + filename;
    return ud14SearchMapper.selectVariablesByVal(val);
  }
}
