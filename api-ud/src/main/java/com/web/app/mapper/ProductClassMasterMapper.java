package com.web.app.mapper;

import com.web.app.entity.ProductClassMaster;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface ProductClassMasterMapper {
    List<ProductClassMaster> selectAllPc();
}
