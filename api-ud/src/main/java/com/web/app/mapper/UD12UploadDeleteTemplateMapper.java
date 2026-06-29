package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import com.web.app.entity.MarketMaster;

import java.util.List;

/**
 * UD12上传删除模板数据访问层
 */
@Mapper
public interface UD12UploadDeleteTemplateMapper {
    /**
     * 获取所有市场列表
     * @return 市场列表
     */
    List<MarketMaster> getAllMarkets();
}