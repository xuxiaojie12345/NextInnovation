package com.web.app.mapper;

import com.web.app.domain.entity.MarketMaster;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * UD12数据访问层
 * 模板上传删除管理（UD12UploadDeletetemplatApi）
 * 对应全体APIのプロンプト.txt 【UD12UploadDeletetemplatApi】
 */
@Mapper
public interface UD12Mapper {

    /**
     * UD12SelectMarket - 查询所有市场信息
     * 对应SQL: SELECT MARKET FROM MARKET_MASTER
     * @return 市场列表
     */
    List<MarketMaster> selectAllMarketMaster();
}
