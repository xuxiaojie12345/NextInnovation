package com.web.app.service;

import java.util.List;

public interface UD14SearchService {
  List<String> selectAllMarkets();

  List<String> selectVariablesByMarketAndFile(String market, String filename);
}
