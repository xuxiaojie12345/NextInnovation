package com.web.app.service;

import com.web.app.dto.FileInfoResponse;
import com.web.app.dto.MarketListResponse;
import com.web.app.dto.UsedDataResponse;
import java.util.List;

public interface UD14ListAvailableTemplatesService {
    List<MarketListResponse> selectMarketMaster();
    List<FileInfoResponse> selectAllFiles();
    List<UsedDataResponse> selectHdocUserDefinedUsed(String market);
    byte[] downloadFile(String market, String fileName);
}
