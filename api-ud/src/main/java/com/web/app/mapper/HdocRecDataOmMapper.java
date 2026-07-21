package com.web.app.mapper;

import com.web.app.entity.HdocRecDataOm;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface HdocRecDataOmMapper {
    List<HdocRecDataOm> selectByChassisNo(@Param("chassisNo") String chassisNo);
}
