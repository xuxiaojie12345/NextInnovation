package com.web.app.mapper;

import com.web.app.entity.HdocRecDataVdaVariants;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface HdocRecDataVdaVariantsMapper {
    List<HdocRecDataVdaVariants> selectByChassisNo(@Param("chassisNo") String chassisNo);
}
