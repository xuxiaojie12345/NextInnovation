package com.web.app.service;

import com.web.app.dto.*;
import java.util.List;

public interface UD08HomologationVariablesService {
    List<PcListResponse> selectProductClassMaster();
    List<MarketListResponse> selectMarketMaster();
    HdocVariablesResponse selectHdocVariables(String variable);
    void updateHdocUserDefinedRules(Ud08UpdateRequest request);
    void addHdocUserDefinedRules(Ud08AddRequest request);
    void deleteHdocUserDefinedRules(Ud08DeleteRequest request);
}
