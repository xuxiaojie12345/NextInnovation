#!/bin/bash
# ------------------------------------------------------------------
# CRUD モジュール自動生成スクリプト（NextInnovation）
# 使用法: ./generate-crud.sh <EntityName> <table_name> <api_path>
# 例:    ./generate-crud.sh ProductMaster m_product /api/product
# ------------------------------------------------------------------

ENTITY=$1
TABLE=$2
API_PATH=$3
ENTITY_LOWER=$(echo "${ENTITY:0:1}" | tr '[:upper:]' '[:lower:]')${ENTITY:1}

BASE_DIR="api-ud/src/main/java/com/web"
RESOURCE_DIR="api-ud/src/main/resources/mapper"

echo "=== CRUD Generator for ${ENTITY} ==="

# Entity
cat > "${BASE_DIR}/entity/${ENTITY}.java" << EOF
package com.web.entity;

import lombok.Data;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Data
@Table(name = "${TABLE}")
public class ${ENTITY} {
    private Integer id;
    private String name;
    private String deleteFlag;
    private LocalDateTime createDate;
    private String createUser;
    private LocalDateTime updateDate;
    private String updateUser;
}
EOF
echo "✓ Entity created: ${ENTITY}.java"

# Mapper interface
cat > "${BASE_DIR}/mapper/${ENTITY}Mapper.java" << EOF
package com.web.mapper;

import com.web.entity.${ENTITY};
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ${ENTITY}Mapper {
    List<${ENTITY}> selectList(${ENTITY} param);
    ${ENTITY} selectById(@Param("id") Integer id);
    int insert(${ENTITY} entity);
    int update(${ENTITY} entity);
    int deleteById(@Param("id") Integer id);
}
EOF
echo "✓ Mapper created: ${ENTITY}Mapper.java"

# Mapper XML (skeleton)
cat > "${RESOURCE_DIR}/${ENTITY}Mapper.xml" << EOF
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.web.mapper.${ENTITY}Mapper">
    <!-- TODO: implement SQL mappings -->
</mapper>
EOF
echo "✓ Mapper XML created: ${ENTITY}Mapper.xml"

echo "=== Done! Remaining files (Service, Controller, Frontend) need manual creation ==="
