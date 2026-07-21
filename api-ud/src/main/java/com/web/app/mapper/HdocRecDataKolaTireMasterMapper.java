package com.web.app.mapper;

import com.web.app.entity.HdocRecDataKolaTireMaster;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface HdocRecDataKolaTireMasterMapper {
    List<HdocRecDataKolaTireMaster> selectByChassisNo(@Param("chassisNo") String chassisNo);
}
