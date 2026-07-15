package com.web.app.tool;

import com.web.app.domain.entity.BaseEntity;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * 审计字段填充工具类
 *
 * 统一处理实体类中 registerDatetime / registerUser / registerProcess /
 * updateDatetime / updateUser / updateProcess 的填充逻辑，
 * 避免在各个 ServiceImpl 中重复编写相同的代码。
 *
 * 所有实体类需继承 {@link BaseEntity} 方可使用本工具。
 */
public final class AuditFieldHelper {

    private static final String SYSTEM_USER = "SYSTEM";

    private static final DateTimeFormatter[] DATE_FORMATTERS = {
            DateTimeFormatter.ISO_LOCAL_DATE_TIME,              // 2026-07-15T10:30:00
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"), // 2026-07-15 10:30:00
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),          // 2026-07-15
    };

    private AuditFieldHelper() {
        // 工具类禁止实例化
    }

    /**
     * 填充新增记录的审计字段（register* + update* 均设置）
     *
     * @param entity  实体对象（必须继承 BaseEntity）
     * @param user    操作用户，为 null 时使用 "SYSTEM"
     * @param process 操作程序名（如 "UD08Add"）
     */
     /**

      * fillCreateFields

      */

    public static void fillCreateFields(BaseEntity entity, String user, String process) {
        LocalDateTime now = LocalDateTime.now();

        entity.setRegisterDatetime(now);
        entity.setRegisterUser(user != null ? user.trim() : SYSTEM_USER);
        entity.setRegisterProcess(process);

        entity.setUpdateDatetime(now);
        entity.setUpdateUser(user != null ? user.trim() : SYSTEM_USER);
        entity.setUpdateProcess(process);
    }

    /**
     * 填充新增记录的审计字段，使用指定的注册时间
     *
     * @param entity            实体对象
     * @param user              操作用户
     * @param process           操作程序名
     * @param registerDatetime  注册时间字符串，为 null 或空时使用当前时间
     */
    public static void fillCreateFields(BaseEntity entity, String user, String process,
                                         String registerDatetime) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime regDt = parseDateTime(registerDatetime, now);

        entity.setRegisterDatetime(regDt);
        entity.setRegisterUser(user != null ? user.trim() : SYSTEM_USER);
        entity.setRegisterProcess(process);

        entity.setUpdateDatetime(now);
        entity.setUpdateUser(user != null ? user.trim() : SYSTEM_USER);
        entity.setUpdateProcess(process);
    }

    /**
     * 填充更新记录的审计字段（仅设置 update*）
     *
     * @param entity  实体对象
     * @param user    操作用户，为 null 时使用 "SYSTEM"
     * @param process 操作程序名（如 "UD08Update"）
     */
     /**

      * fillUpdateFields

      */

    public static void fillUpdateFields(BaseEntity entity, String user, String process) {
        entity.setUpdateDatetime(LocalDateTime.now());
        entity.setUpdateUser(user != null ? user.trim() : SYSTEM_USER);
        entity.setUpdateProcess(process);
    }

    /**
     * 填充更新记录的审计字段，使用指定的更新时间
     *
     * @param entity            实体对象
     * @param user              操作用户
     * @param process           操作程序名
     * @param updateDatetimeStr 更新时间字符串，为 null 或空时使用当前时间
     */
    public static void fillUpdateFields(BaseEntity entity, String user, String process,
                                         String updateDatetimeStr) {
        LocalDateTime dt = parseDateTime(updateDatetimeStr, LocalDateTime.now());
        entity.setUpdateDatetime(dt);
        entity.setUpdateUser(user != null ? user.trim() : SYSTEM_USER);
        entity.setUpdateProcess(process);
    }

    /**
     * 安全地解析日期时间字符串
     * <p>
     * 支持以下格式：
     * <ul>
     *   <li>yyyy-MM-dd'T'HH:mm:ss（ISO 格式）</li>
     *   <li>yyyy-MM-dd HH:mm:ss</li>
     *   <li>yyyy-MM-dd（自动补全为当天的 00:00:00）</li>
     * </ul>
     *
     * @param dateTimeStr 日期时间字符串
     * @param defaultVal  解析失败时返回的默认值
     * @return 解析后的 LocalDateTime，失败时返回 defaultVal
     */
     /**

      * parseDateTime

      */

    public static LocalDateTime parseDateTime(String dateTimeStr, LocalDateTime defaultVal) {
        if (dateTimeStr == null || dateTimeStr.trim().isEmpty()) {
            return defaultVal;
        }

        String trimmed = dateTimeStr.trim();

        // yyyy-MM-dd（10字符）补全时间部分
        if (trimmed.length() == 10) {
            trimmed = trimmed + " 00:00:00";
        }

        // 尝试多个格式
        for (DateTimeFormatter fmt : DATE_FORMATTERS) {
            try {
                return LocalDateTime.parse(trimmed, fmt);
            } catch (DateTimeParseException ignored) {
                // 继续尝试下一个格式
            }
        }

        // ISO 格式中可能包含空格而不是 T
        if (trimmed.contains(" ") && !trimmed.contains("T")) {
            try {
                return LocalDateTime.parse(trimmed.replace(" ", "T"),
                        DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (DateTimeParseException ignored) {
                // 忽略
            }
        }

        return defaultVal;
    }
}
