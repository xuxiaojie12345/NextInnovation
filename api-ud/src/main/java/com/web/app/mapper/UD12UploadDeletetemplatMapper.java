package com.web.app.mapper;

import com.web.app.entity.MarketMaster;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * UD12 上传删除模板数据访问层
 *
 * 功能说明：执行市场列表查询等数据操作
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD12UploadDeletetemplatMapper {

    /**
     * 查询所有市场
     *
     * @return 市场列表
     */
    List<MarketMaster> selectAllMarket();
}
