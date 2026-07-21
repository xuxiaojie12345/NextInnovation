package com.web.app.mapper;

import com.web.app.entity.HdocRecDataVdaGeneral;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface HdocRecDataVdaGeneralMapper {
    List<HdocRecDataVdaGeneral> selectByChassisNo(@Param("chassisNo") String chassisNo);
}
