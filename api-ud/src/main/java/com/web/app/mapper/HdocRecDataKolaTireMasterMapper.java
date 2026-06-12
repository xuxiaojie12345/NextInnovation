package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocRecDataKolaTireMaster;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocRecDataKolaTireMasterMapper {
    HdocRecDataKolaTireMaster selectByPartno(@Param("partno") String partno);
}
