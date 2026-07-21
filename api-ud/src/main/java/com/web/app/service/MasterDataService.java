package com.web.app.service;

import com.web.app.dto.response.SelectListResponse;
import java.util.List;

public interface MasterDataService {
    List<SelectListResponse> getProductClassList();
    List<SelectListResponse> getMarketList();
    List<SelectListResponse> getVariableList();
    List<String> getDistinctVariableList();
}
