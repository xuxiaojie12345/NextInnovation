package com.web.app.mapper;

import com.web.app.entity.HdocRecDataKapSnote;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface HdocRecDataKapSnoteMapper {
    List<HdocRecDataKapSnote> selectByChassisNo(@Param("chassisNo") String chassisNo);
}
