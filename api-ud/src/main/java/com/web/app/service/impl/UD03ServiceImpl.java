package com.web.app.service.impl;

import com.web.app.domain.entity.DocumentType;
import com.web.app.mapper.UD03Mapper;
import com.web.app.service.UD03Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * UD03业务逻辑实现类
 */
@Service
public class UD03ServiceImpl implements UD03Service {

    @Autowired
    private UD03Mapper ud03Mapper;

    @Override
    public List<DocumentType> getAllDocumentTypes() {
        // 调用Mapper层查询所有文档类型
        return ud03Mapper.selectAllDocumentTypes();
    }
}
