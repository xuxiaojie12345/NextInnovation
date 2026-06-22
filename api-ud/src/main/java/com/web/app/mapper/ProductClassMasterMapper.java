package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * UD08_ProductClassMaster Mapper接口
 * 提供产品类别主数据的查询操作
 */
@Mapper
public interface ProductClassMasterMapper {

    /**
     * 查询所有产品类别
     *
     * @return 产品类别列表（包含PC字段）
     */
    @Select("SELECT PC AS pc FROM PRODUCT_CLASS_MASTER")
    List<Map<String, Object>> selectAllProductClasses();
}
