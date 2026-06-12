package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocRecDataVdaVariants;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocRecDataVdaVariantsMapper {
    HdocRecDataVdaVariants selectBySerieAndChnr(@Param("serie") String serie, @Param("chnr") String chnr);
}
