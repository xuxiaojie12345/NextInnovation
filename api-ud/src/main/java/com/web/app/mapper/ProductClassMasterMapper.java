package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.ProductClassMaster;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface ProductClassMasterMapper {
    List<ProductClassMaster> selectAll();
}
