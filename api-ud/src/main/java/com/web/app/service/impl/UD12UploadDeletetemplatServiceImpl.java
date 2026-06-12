package com.web.app.service.impl;

import com.web.app.service.UD12UploadDeletetemplatService;
import com.web.app.dto.*;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.entity.MarketMaster;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Service
public class UD12UploadDeletetemplatServiceImpl implements UD12UploadDeletetemplatService {

    @Autowired
    private MarketMasterMapper marketMasterMapper;

    private static final String UPLOAD_DIR = "d://uploads/templates/";

    @Override
    public UD12MarketListResponse selectMarketMaster() {
        List<MarketMaster> list = marketMasterMapper.selectAll();
        List<UD12MarketListResponse.MarketItem> items = new ArrayList<>();
        for (MarketMaster m : list) {
            UD12MarketListResponse.MarketItem item = new UD12MarketListResponse.MarketItem();
            item.setMarket(m.getMarket());
            items.add(item);
        }
        return UD12MarketListResponse.success(items);
    }

    @Override
    public UD12FileOperationResponse uploadFile(MultipartFile file, String market) {
        if (file == null || file.isEmpty()) {
            return UD12FileOperationResponse.error("NO FILE UPLOADED");
        }
        if (market == null || market.isEmpty()) {
            return UD12FileOperationResponse.error("请选择目标市场");
        }
        try {
            String dirPath = UPLOAD_DIR + market + "/";
            File dir = new File(dirPath);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            String fileName = file.getOriginalFilename();
            File dest = new File(dirPath + fileName);
            file.transferTo(dest);
            return UD12FileOperationResponse.success("TEMPLATE [" + fileName + "] WAS SUCCESSFULLY UPLOADED TO MARKET [" + market + "]");
        } catch (Exception e) {
            return UD12FileOperationResponse.error("Upload failed: " + e.getMessage());
        }
    }

    @Override
    public UD12FileOperationResponse deleteFile(UD12UploadDeletetemplatRequest request) {
        if (request.getMarket() == null || request.getTemplate() == null) {
            return UD12FileOperationResponse.error("Market and template are required");
        }
        try {
            String filePath = UPLOAD_DIR + request.getMarket() + "/" + request.getTemplate();
            File file = new File(filePath);
            if (file.exists()) {
                file.delete();
            }
            return UD12FileOperationResponse.success("TEMPLATE [" + request.getTemplate() + "] WAS SUCCESSFULLY DELETED FROM MARKET [" + request.getMarket() + "]");
        } catch (Exception e) {
            return UD12FileOperationResponse.error("Delete failed: " + e.getMessage());
        }
    }
}
