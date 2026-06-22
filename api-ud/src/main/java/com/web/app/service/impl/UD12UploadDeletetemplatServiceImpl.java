package com.web.app.service.impl;

import com.web.app.dto.UD12UploadDeletetemplatRequest;
import com.web.app.dto.UD12UploadDeletetemplatResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.UD12UploadDeletetemplatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD12 - 上传/删除模板服务实现类
 */
@Service
public class UD12UploadDeletetemplatServiceImpl implements UD12UploadDeletetemplatService {

    @Value("${hdoc.template.upload-path:F:/hdoc/template/upload}")
    private String uploadPath;

    @Autowired
    private MarketMasterMapper marketMasterMapper;

    @Override
    public UD12UploadDeletetemplatResponse selectMarket() {
        List<MarketMaster> markets = marketMasterMapper.selectAll();

        Map<String, Object> data = new HashMap<>();
        data.put("markets", markets);

        UD12UploadDeletetemplatResponse response = new UD12UploadDeletetemplatResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD12UploadDeletetemplatResponse uploadFile(UD12UploadDeletetemplatRequest request) {
        UD12UploadDeletetemplatResponse response = new UD12UploadDeletetemplatResponse();

        // 参数校验
        if (request.getFile() == null || request.getFile().isEmpty()) {
            response.setCode(400);
            response.setMsg("NO FILE UPLOADED");
            return response;
        }
        if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("请选择目标市场");
            return response;
        }

        try {
            // 构建市场目录
            String marketDir = uploadPath + File.separator + request.getMarket();
            File dir = new File(marketDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // 保存文件
            String fileName = request.getFile().getOriginalFilename();
            Path targetPath = Paths.get(marketDir, fileName);
            Files.copy(request.getFile().getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            response.setCode(200);
            response.setMsg("TEMPLATE " + fileName + " WAS SUCCESSFULLY UPLOADED TO MARKET " + request.getMarket());
        } catch (Exception e) {
            response.setCode(500);
            response.setMsg("上传失败: " + e.getMessage());
        }

        return response;
    }

    @Override
    public UD12UploadDeletetemplatResponse deleteFile(UD12UploadDeletetemplatRequest request) {
        UD12UploadDeletetemplatResponse response = new UD12UploadDeletetemplatResponse();

        // 参数校验
        if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("市场不能为空");
            return response;
        }
        if (request.getTemplateName() == null || request.getTemplateName().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("模板文件名不能为空");
            return response;
        }

        try {
            // 构建文件路径
            String filePath = uploadPath + File.separator + request.getMarket() + File.separator + request.getTemplateName();
            File file = new File(filePath);

            if (!file.exists()) {
                response.setCode(404);
                response.setMsg("文件不存在");
                return response;
            }

            file.delete();

            response.setCode(200);
            response.setMsg("TEMPLATE " + request.getTemplateName() + " WAS SUCCESSFULLY DELETED FROM MARKET " + request.getMarket());
        } catch (Exception e) {
            response.setCode(500);
            response.setMsg("删除失败: " + e.getMessage());
        }

        return response;
    }
}
