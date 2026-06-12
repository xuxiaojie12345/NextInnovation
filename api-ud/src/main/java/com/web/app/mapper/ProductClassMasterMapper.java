package com.web.app.mapper;

import com.web.app.entity.ProductClassMaster;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

/**
 * 产品类别主数据Mapper接口
 */
@Mapper
public interface ProductClassMasterMapper {
    
    /**
     * 查询所有产品类别
     */
    List<ProductClassMaster> selectAll();
}
